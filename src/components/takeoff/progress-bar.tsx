"use client";

import type { ProgressEvent } from "@/types";

interface ProgressBarProps {
  progress: ProgressEvent | null;
  status: "idle" | "connecting" | "streaming" | "complete" | "error";
}

export function ProgressBar({ progress, status }: ProgressBarProps) {
  if (status === "idle") return null;

  const percentage = progress?.percentage ?? 0;
  const message = progress?.message ?? getDefaultMessage(status);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-neutral-700">{message}</span>
        <span className="text-neutral-500">{percentage}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-neutral-200">
        <div
          className={`h-full transition-all duration-300 ${getBarColor(status)}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

function getDefaultMessage(status: string): string {
  switch (status) {
    case "connecting":
      return "Connecting...";
    case "streaming":
      return "Analyzing blueprint...";
    case "complete":
      return "Analysis complete";
    case "error":
      return "Error occurred";
    default:
      return "";
  }
}

function getBarColor(status: string): string {
  switch (status) {
    case "error":
      return "bg-red-500";
    case "complete":
      return "bg-green-500";
    default:
      return "bg-blue-500";
  }
}
