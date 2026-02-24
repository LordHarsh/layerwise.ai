"use client";

import { useState, useCallback, useRef } from "react";
import type {
  TakeoffItem,
  DocumentIntelligence,
  Space,
  RoomTakeoff,
  PipelineCompleteEvent,
} from "@/types";

export type PipelineStatus =
  | "idle"
  | "connecting"
  | "phase-1"
  | "phase-2"
  | "phase-3"
  | "complete"
  | "error";

interface PipelineStreamState {
  status: PipelineStatus;
  docIntelligence: DocumentIntelligence | null;
  spaces: Space[];
  roomResults: Map<string, RoomTakeoff>;
  currentRoom: string | null;
  allItems: TakeoffItem[];
  availableTrades: string[];
  summary: PipelineCompleteEvent | null;
  error: string | null;
}

interface UsePipelineStreamOptions {
  apiUrl?: string;
}

const AVAILABLE_TRADES = [
  "electrical",
  "plumbing",
  "hvac",
  "structural",
  "finishes",
];

export function usePipelineStream(options: UsePipelineStreamOptions = {}) {
  const defaultApiUrl =
    typeof window !== "undefined" && window.location.hostname === "localhost"
      ? "http://localhost:8000"
      : "";
  const { apiUrl = process.env.NEXT_PUBLIC_API_URL || defaultApiUrl } = options;

  const [state, setState] = useState<PipelineStreamState>({
    status: "idle",
    docIntelligence: null,
    spaces: [],
    roomResults: new Map(),
    currentRoom: null,
    allItems: [],
    availableTrades: [],
    summary: null,
    error: null,
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  /** Build the full URL for a pipeline endpoint. */
  const endpoint = useCallback(
    (path: string) =>
      apiUrl ? `${apiUrl}/takeoff/${path}` : `/python/takeoff/${path}`,
    [apiUrl]
  );

  /** POST JSON and return parsed response. Throws on HTTP or network errors. */
  const postJson = useCallback(
    async <T>(path: string, body: Record<string, unknown>): Promise<T> => {
      const res = await fetch(endpoint(path), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: abortControllerRef.current?.signal,
      });

      if (!res.ok) {
        const detail = await res.text().catch(() => res.statusText);
        throw new Error(`${path} failed (${res.status}): ${detail}`);
      }

      return res.json() as Promise<T>;
    },
    [endpoint]
  );

  const startPipeline = useCallback(
    async (blueprintUrl: string, scale?: string) => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();

      setState({
        status: "connecting",
        docIntelligence: null,
        spaces: [],
        roomResults: new Map(),
        currentRoom: null,
        allItems: [],
        availableTrades: [],
        summary: null,
        error: null,
      });

      try {
        // ── Phase 1: Document Intelligence ──
        setState((prev) => ({ ...prev, status: "phase-1" }));

        const docIntelligence = await postJson<DocumentIntelligence>(
          "doc-intelligence",
          { blueprint_url: blueprintUrl }
        );

        // Determine scale: manual override > detected > null
        const resolvedScale =
          scale || docIntelligence.scale?.scale_string || null;

        setState((prev) => ({ ...prev, docIntelligence }));

        // ── Phase 2: Space Detection ──
        setState((prev) => ({ ...prev, status: "phase-2" }));

        const spaceResult = await postJson<{ spaces: Space[]; total_area_estimate?: number | null; floor_count: number }>(
          "detect-spaces",
          {
            blueprint_url: blueprintUrl,
            doc_type: docIntelligence.doc_type,
            scale: resolvedScale,
          }
        );

        setState((prev) => ({ ...prev, spaces: spaceResult.spaces }));

        // ── Phase 3: Room-by-Room Extraction ──
        setState((prev) => ({ ...prev, status: "phase-3" }));

        const allItems: TakeoffItem[] = [];
        const roomResults = new Map<string, RoomTakeoff>();

        for (const space of spaceResult.spaces) {
          setState((prev) => ({ ...prev, currentRoom: space.id }));

          try {
            const result = await postJson<{
              space_name: string;
              items: TakeoffItem[];
            }>("room-takeoff", {
              blueprint_url: blueprintUrl,
              space_name: space.name,
              space_type: space.type,
              scale: resolvedScale,
            });

            const items = result.items || [];
            allItems.push(...items);

            roomResults.set(space.id, {
              space_id: space.id,
              space_name: space.name,
              items,
              notes: [],
            });

            setState((prev) => ({
              ...prev,
              roomResults: new Map(roomResults),
              allItems: [...allItems],
              currentRoom: null,
            }));
          } catch (roomErr) {
            // Log but don't abort the whole pipeline for one room failure
            console.warn(`Room takeoff failed for ${space.name}:`, roomErr);

            roomResults.set(space.id, {
              space_id: space.id,
              space_name: space.name,
              items: [],
              notes: [],
            });

            setState((prev) => ({
              ...prev,
              roomResults: new Map(roomResults),
              currentRoom: null,
            }));
          }
        }

        // ── Build summary ──
        const summary: Record<string, number> = {};
        for (const item of allItems) {
          const key = `total_${item.category}`;
          summary[key] = (summary[key] || 0) + item.quantity;
        }

        const completeEvent: PipelineCompleteEvent = {
          total_items: allItems.length,
          summary,
          scale_used: resolvedScale,
          available_trades: AVAILABLE_TRADES,
        };

        setState((prev) => ({
          ...prev,
          status: "complete",
          summary: completeEvent,
          availableTrades: AVAILABLE_TRADES,
        }));
      } catch (error) {
        if ((error as Error).name === "AbortError") {
          setState((prev) => ({ ...prev, status: "idle" }));
          return;
        }

        setState((prev) => ({
          ...prev,
          status: "error",
          error: (error as Error).message || "Failed to connect",
        }));
      }
    },
    [postJson]
  );

  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setState((prev) => ({ ...prev, status: "idle" }));
  }, []);

  const reset = useCallback(() => {
    cancel();
    setState({
      status: "idle",
      docIntelligence: null,
      spaces: [],
      roomResults: new Map(),
      currentRoom: null,
      allItems: [],
      availableTrades: [],
      summary: null,
      error: null,
    });
  }, [cancel]);

  return {
    ...state,
    startPipeline,
    cancel,
    reset,
  };
}
