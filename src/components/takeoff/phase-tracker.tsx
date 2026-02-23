"use client";

import { CheckCircle2, Loader2, Circle, Zap } from "lucide-react";
import type { PipelineStatus } from "@/hooks/use-pipeline-stream";

interface Phase {
  number: number;
  name: string;
  description: string;
}

const PHASES: Phase[] = [
  { number: 1, name: "Document Intelligence", description: "Type, scale, complexity" },
  { number: 2, name: "Space Detection", description: "Rooms & areas identified" },
  { number: 3, name: "Quantity Extraction", description: "Items per room" },
  { number: 4, name: "Trade Deep-Dives", description: "Specialized analysis" },
];

interface PhaseTrackerProps {
  status: PipelineStatus;
  hasTradeResults: boolean;
}

export function PhaseTracker({ status, hasTradeResults }: PhaseTrackerProps) {
  const currentPhase = getPhaseNumber(status);

  return (
    <div className="flex items-center gap-1">
      {PHASES.map((phase, idx) => {
        const phaseStatus = getPhaseStatus(phase.number, currentPhase, status, hasTradeResults);
        return (
          <div key={phase.number} className="flex items-center gap-1">
            {idx > 0 && (
              <div
                className={`h-px w-4 sm:w-6 ${
                  phaseStatus === "complete"
                    ? "bg-emerald-400"
                    : "bg-[#e2d5c3]"
                }`}
              />
            )}
            <PhaseStep phase={phase} phaseStatus={phaseStatus} />
          </div>
        );
      })}
    </div>
  );
}

type PhaseStepStatus = "pending" | "active" | "complete";

function PhaseStep({
  phase,
  phaseStatus,
}: {
  phase: Phase;
  phaseStatus: PhaseStepStatus;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <PhaseIcon status={phaseStatus} />
      <div className="hidden sm:block">
        <p
          className={`text-xs font-medium leading-tight ${
            phaseStatus === "active"
              ? "text-[#c2410c]"
              : phaseStatus === "complete"
                ? "text-emerald-700"
                : "text-[#a8a29e]"
          }`}
        >
          {phase.name}
        </p>
      </div>
    </div>
  );
}

function PhaseIcon({ status }: { status: PhaseStepStatus }) {
  if (status === "complete") {
    return <CheckCircle2 className="size-4 shrink-0 text-emerald-500" />;
  }
  if (status === "active") {
    return <Loader2 className="size-4 shrink-0 animate-spin text-[#c2410c]" />;
  }
  return <Circle className="size-4 shrink-0 text-[#d6cfc5]" />;
}

function getPhaseNumber(status: PipelineStatus): number {
  switch (status) {
    case "phase-1":
      return 1;
    case "phase-2":
      return 2;
    case "phase-3":
      return 3;
    case "complete":
      return 4;
    default:
      return 0;
  }
}

function getPhaseStatus(
  phaseNum: number,
  currentPhase: number,
  status: PipelineStatus,
  hasTradeResults: boolean
): PhaseStepStatus {
  if (status === "complete" && phaseNum <= 3) return "complete";
  if (phaseNum === 4 && hasTradeResults) return "complete";
  if (phaseNum === currentPhase) return "active";
  if (phaseNum < currentPhase) return "complete";
  return "pending";
}
