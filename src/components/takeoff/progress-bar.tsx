"use client";

import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {status === "complete" ? (
            <CheckCircle2 className="size-3.5 text-emerald-500" />
          ) : status === "error" ? (
            <AlertCircle className="size-3.5 text-destructive" />
          ) : (
            <Loader2 className="size-3.5 animate-spin text-muted-foreground" />
          )}
          <span className="text-xs font-medium text-muted-foreground">{message}</span>
        </div>
        <span className="text-xs tabular-nums text-muted-foreground">{percentage}%</span>
      </div>
      <Progress
        value={percentage}
        className={`h-1.5 ${
          status === "error"
            ? "*:data-[slot=progress-indicator]:bg-destructive"
            : status === "complete"
              ? "*:data-[slot=progress-indicator]:bg-emerald-500"
              : ""
        }`}
      />
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
