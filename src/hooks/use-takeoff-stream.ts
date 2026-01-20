"use client";

import { useState, useCallback, useRef } from "react";
import type {
  TakeoffItem,
  ProgressEvent,
  ScaleEvent,
  CompleteEvent,
} from "@/types";

interface TakeoffStreamState {
  status: "idle" | "connecting" | "streaming" | "complete" | "error";
  progress: ProgressEvent | null;
  scale: ScaleEvent | null;
  items: TakeoffItem[];
  summary: CompleteEvent | null;
  error: string | null;
}

interface UseTakeoffStreamOptions {
  apiUrl?: string;
}

export function useTakeoffStream(options: UseTakeoffStreamOptions = {}) {
  // In production, use /py-api which rewrites to the Python serverless function
  // In development, use localhost:8000 for the local FastAPI server
  const defaultApiUrl = typeof window !== "undefined" && window.location.hostname === "localhost"
    ? "http://localhost:8000"
    : "";
  const { apiUrl = process.env.NEXT_PUBLIC_API_URL || defaultApiUrl } = options;

  const [state, setState] = useState<TakeoffStreamState>({
    status: "idle",
    progress: null,
    scale: null,
    items: [],
    summary: null,
    error: null,
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  const startTakeoff = useCallback(
    async (blueprintUrl: string, scale?: string) => {
      // Abort any existing stream
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();

      setState({
        status: "connecting",
        progress: null,
        scale: null,
        items: [],
        summary: null,
        error: null,
      });

      try {
        // Use /api/index (Python serverless) in production, /takeoff in local dev
        const endpoint = apiUrl ? `${apiUrl}/takeoff/stream` : "/api/index/takeoff/stream";
        const response = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            blueprint_url: blueprintUrl,
            scale: scale || null,
            auto_detect_scale: !scale,
          }),
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          throw new Error(`HTTP error: ${response.status}`);
        }

        if (!response.body) {
          throw new Error("No response body");
        }

        setState((prev) => ({ ...prev, status: "streaming" }));

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();

          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          // Parse SSE events
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
                  const data = JSON.parse(eventData);
                  handleEvent(eventType, data);
                } catch {
                  // Skip malformed JSON
                }
                eventType = "";
                eventData = "";
              }
            }
          }
        }

        setState((prev) => ({
          ...prev,
          status: prev.error ? "error" : "complete",
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
    [apiUrl]
  );

  const handleEvent = useCallback((eventType: string, data: unknown) => {
    switch (eventType) {
      case "progress":
        setState((prev) => ({
          ...prev,
          progress: data as ProgressEvent,
        }));
        break;

      case "scale":
        setState((prev) => ({
          ...prev,
          scale: data as ScaleEvent,
        }));
        break;

      case "item":
        setState((prev) => ({
          ...prev,
          items: [...prev.items, data as TakeoffItem],
        }));
        break;

      case "complete":
        setState((prev) => ({
          ...prev,
          status: "complete",
          summary: data as CompleteEvent,
        }));
        break;

      case "error":
        setState((prev) => ({
          ...prev,
          status: "error",
          error: (data as { message: string }).message,
        }));
        break;
    }
  }, []);

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
      progress: null,
      scale: null,
      items: [],
      summary: null,
      error: null,
    });
  }, [cancel]);

  return {
    ...state,
    startTakeoff,
    cancel,
    reset,
  };
}
