"use client";

import {
  Home,
  ArrowRightLeft,
  Trees,
  Wrench,
  HelpCircle,
  Loader2,
  CheckCircle2,
  Package,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Space, SpaceType, RoomTakeoff } from "@/types";

interface SpaceListProps {
  spaces: Space[];
  roomResults: Map<string, RoomTakeoff>;
  currentRoom: string | null;
  totalArea?: number | null;
}

const typeIcons: Record<SpaceType, React.ReactNode> = {
  room: <Home className="size-3.5" />,
  corridor: <ArrowRightLeft className="size-3.5" />,
  exterior: <Trees className="size-3.5" />,
  utility: <Wrench className="size-3.5" />,
  other: <HelpCircle className="size-3.5" />,
};

const typeColors: Record<SpaceType, string> = {
  room: "text-blue-600",
  corridor: "text-amber-600",
  exterior: "text-green-600",
  utility: "text-purple-600",
  other: "text-gray-500",
};

export function SpaceList({
  spaces,
  roomResults,
  currentRoom,
  totalArea,
}: SpaceListProps) {
  if (spaces.length === 0) return null;

  const completedCount = roomResults.size;
  const totalItems = Array.from(roomResults.values()).reduce(
    (sum, r) => sum + r.items.length,
    0
  );

  return (
    <div className="space-y-2">
      {/* Summary header */}
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-[#78716c]">
          {spaces.length} spaces found
        </p>
        {totalArea && (
          <Badge variant="outline" className="border-[#e2d5c3] text-[10px]">
            ~{Math.round(totalArea).toLocaleString()} SF
          </Badge>
        )}
      </div>

      {/* Progress */}
      {completedCount > 0 && (
        <div className="flex items-center gap-2 text-[11px] text-[#78716c]">
          <Package className="size-3" />
          <span>
            {completedCount}/{spaces.length} scanned &middot; {totalItems} items
          </span>
        </div>
      )}

      {/* Space list */}
      <div className="max-h-64 space-y-1 overflow-y-auto pr-1">
        {spaces.map((space) => {
          const result = roomResults.get(space.id);
          const isProcessing = currentRoom === space.id;
          const itemCount = result?.items.length ?? 0;

          return (
            <div
              key={space.id}
              className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 transition-colors ${
                isProcessing
                  ? "bg-[rgba(194,65,12,0.08)] ring-1 ring-[#c2410c]/20"
                  : result
                    ? "bg-[#faf7f2]"
                    : "bg-transparent"
              }`}
            >
              {/* Status icon */}
              <div className={`shrink-0 ${typeColors[space.type]}`}>
                {isProcessing ? (
                  <Loader2 className="size-3.5 animate-spin text-[#c2410c]" />
                ) : result ? (
                  <CheckCircle2 className="size-3.5 text-emerald-500" />
                ) : (
                  typeIcons[space.type]
                )}
              </div>

              {/* Name */}
              <span
                className={`flex-1 truncate text-xs ${
                  isProcessing
                    ? "font-medium text-[#c2410c]"
                    : "text-[#292018]"
                }`}
              >
                {space.name}
              </span>

              {/* Area / item count */}
              {result ? (
                <Badge
                  variant="secondary"
                  className="bg-emerald-50 text-[10px] text-emerald-700"
                >
                  {itemCount} items
                </Badge>
              ) : space.area_estimate ? (
                <span className="text-[10px] tabular-nums text-[#a8a29e]">
                  ~{Math.round(space.area_estimate)} SF
                </span>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
