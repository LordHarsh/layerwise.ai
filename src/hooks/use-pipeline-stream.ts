"use client";

import { useState, useCallback, useRef } from "react";
import type {
  TakeoffItem,
  DocumentIntelligence,
  Space,
  RoomTakeoff,
  RoomItemsEvent,
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

  const handleEvent = useCallback((eventType: string, data: unknown) => {
    const d = data as Record<string, unknown>;

    switch (eventType) {
      case "phase_start": {
        const phase = d.phase as number;
        const statusMap: Record<number, PipelineStatus> = {
          1: "phase-1",
          2: "phase-2",
          3: "phase-3",
        };
        setState((prev) => ({
          ...prev,
          status: statusMap[phase] || prev.status,
        }));
        break;
      }

      case "doc_intelligence":
        setState((prev) => ({
          ...prev,
          docIntelligence: d as unknown as DocumentIntelligence,
        }));
        break;

      case "spaces":
        setState((prev) => ({
          ...prev,
          spaces: (d.spaces as Space[]) || [],
        }));
        break;

      case "room_start":
        setState((prev) => ({
          ...prev,
          currentRoom: d.space_id as string,
        }));
        break;

      case "room_items": {
        const evt = d as unknown as RoomItemsEvent;
        setState((prev) => {
          const newMap = new Map(prev.roomResults);
          newMap.set(evt.space_id, {
            space_id: evt.space_id,
            space_name: evt.space_name,
            items: evt.items || [],
            notes: [],
          });
          const newAllItems = [...prev.allItems, ...(evt.items || [])];
          return {
            ...prev,
            roomResults: newMap,
            allItems: newAllItems,
            currentRoom: null,
          };
        });
        break;
      }

      case "complete": {
        const complete = d as unknown as PipelineCompleteEvent;
        setState((prev) => ({
          ...prev,
          status: "complete",
          summary: complete,
          availableTrades: complete.available_trades || [],
        }));
        break;
      }

      case "error":
        setState((prev) => ({
          ...prev,
          status: "error",
          error: (d.message as string) || "Unknown error",
        }));
        break;
    }
  }, []);

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
        const endpoint = apiUrl
          ? `${apiUrl}/takeoff/stream-pipeline`
          : "/python/takeoff/stream-pipeline";

        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            blueprint_url: blueprintUrl,
            scale: scale || null,
          }),
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          throw new Error(`HTTP error: ${response.status}`);
        }

        if (!response.body) {
          throw new Error("No response body");
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          let eventType = "";
          let eventData = "";

          for (const line of lines) {
            if (line.startsWith("event: ")) {
              eventType = line.slice(7).trim();
            } else if (line.startsWith("data: ")) {
              eventData = line.slice(6);

              if (eventType && eventData) {
                try {
                  const parsed = JSON.parse(eventData);
                  handleEvent(eventType, parsed);
                } catch {
                  // Skip malformed JSON
                }
                eventType = "";
                eventData = "";
              }
            }
          }
        }

        // If stream ended without a complete event, mark as complete
        setState((prev) =>
          prev.status !== "error" && prev.status !== "complete"
            ? { ...prev, status: "complete" }
            : prev
        );
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
    [apiUrl, handleEvent]
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
