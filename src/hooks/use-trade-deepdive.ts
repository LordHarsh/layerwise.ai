"use client";

import { useState, useCallback, useRef } from "react";
import type { TradeAnalysis, Space } from "@/types";

interface TradeDeepDiveState {
  status: "idle" | "loading" | "complete" | "error";
  trade: string | null;
  result: TradeAnalysis | null;
  error: string | null;
}

interface UseTradeDeepDiveOptions {
  apiUrl?: string;
}

export function useTradeDeepDive(options: UseTradeDeepDiveOptions = {}) {
  const defaultApiUrl =
    typeof window !== "undefined" && window.location.hostname === "localhost"
      ? "http://localhost:8000"
      : "";
  const { apiUrl = process.env.NEXT_PUBLIC_API_URL || defaultApiUrl } = options;

  const [results, setResults] = useState<Map<string, TradeDeepDiveState>>(
    new Map()
  );

  const abortControllersRef = useRef<Map<string, AbortController>>(new Map());

  const startDeepDive = useCallback(
    async (
      blueprintUrl: string,
      trade: string,
      spaces: Space[],
      scale?: string
    ) => {
      // Abort any existing request for this trade
      const existing = abortControllersRef.current.get(trade);
      if (existing) existing.abort();

      const controller = new AbortController();
      abortControllersRef.current.set(trade, controller);

      setResults((prev) => {
        const next = new Map(prev);
        next.set(trade, {
          status: "loading",
          trade,
          result: null,
          error: null,
        });
        return next;
      });

      try {
        const endpoint = apiUrl
          ? `${apiUrl}/takeoff/trade-deepdive`
          : "/python/takeoff/trade-deepdive";

        // Build spaces summary for the API
        const spacesSummary = spaces
          .map((s) => `- ${s.name} (${s.type}${s.area_estimate ? `, ~${s.area_estimate} SF` : ""})`)
          .join("\n");

        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            blueprint_url: blueprintUrl,
            trade,
            spaces_summary: spacesSummary,
            scale: scale || null,
          }),
          signal: controller.signal,
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

                  if (eventType === "trade_result") {
                    setResults((prev) => {
                      const next = new Map(prev);
                      next.set(trade, {
                        status: "complete",
                        trade,
                        result: parsed as TradeAnalysis,
                        error: null,
                      });
                      return next;
                    });
                  } else if (eventType === "error") {
                    setResults((prev) => {
                      const next = new Map(prev);
                      next.set(trade, {
                        status: "error",
                        trade,
                        result: null,
                        error: (parsed as { message: string }).message,
                      });
                      return next;
                    });
                  }
                } catch {
                  // Skip malformed JSON
                }
                eventType = "";
                eventData = "";
              }
            }
          }
        }
      } catch (error) {
        if ((error as Error).name === "AbortError") return;

        setResults((prev) => {
          const next = new Map(prev);
          next.set(trade, {
            status: "error",
            trade,
            result: null,
            error: (error as Error).message || "Failed to connect",
          });
          return next;
        });
      }
    },
    [apiUrl]
  );

  const getTradeState = useCallback(
    (trade: string): TradeDeepDiveState => {
      return (
        results.get(trade) || {
          status: "idle",
          trade: null,
          result: null,
          error: null,
        }
      );
    },
    [results]
  );

  const resetAll = useCallback(() => {
    abortControllersRef.current.forEach((c) => c.abort());
    abortControllersRef.current.clear();
    setResults(new Map());
  }, []);

  return {
    results,
    startDeepDive,
    getTradeState,
    resetAll,
  };
}
