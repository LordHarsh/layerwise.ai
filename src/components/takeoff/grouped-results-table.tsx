"use client";

import { useState, useMemo } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { TakeoffItem, MeasurementCategory, RoomTakeoff, TradeAnalysis } from "@/types";

const categoryConfig: Record<MeasurementCategory, { label: string; className: string }> = {
  count: { label: "Count", className: "bg-orange-100 text-orange-800" },
  linear: { label: "Linear", className: "bg-blue-100 text-blue-800" },
  area: { label: "Area", className: "bg-green-100 text-green-800" },
  volume: { label: "Volume", className: "bg-violet-100 text-violet-800" },
};

interface GroupedResultsTableProps {
  roomResults: Map<string, RoomTakeoff>;
  tradeResults: Map<string, TradeAnalysis>;
  isStreaming: boolean;
  currentRoom: string | null;
}

export function GroupedResultsTable({
  roomResults,
  tradeResults,
  isStreaming,
  currentRoom,
}: GroupedResultsTableProps) {
  const totalItems = useMemo(() => {
    let count = 0;
    roomResults.forEach((r) => (count += r.items.length));
    return count;
  }, [roomResults]);

  if (totalItems === 0 && !isStreaming) {
    return null;
  }

  if (totalItems === 0 && isStreaming) {
    return <GroupedTableSkeleton />;
  }

  const rooms = Array.from(roomResults.values());
  const trades = Array.from(tradeResults.entries());

  return (
    <div className="space-y-3">
      {/* Summary */}
      <SummaryCounts roomResults={roomResults} />

      {/* Room sections */}
      {rooms.map((room) => (
        <RoomSection
          key={room.space_id}
          room={room}
          isActive={currentRoom === room.space_id}
        />
      ))}

      {/* Trade sections */}
      {trades.map(([trade, analysis]) => (
        <TradeSection key={trade} analysis={analysis} />
      ))}

      {isStreaming && currentRoom && (
        <p className="text-center text-xs text-[#a8a29e]">
          Scanning rooms... more results incoming
        </p>
      )}
    </div>
  );
}

function SummaryCounts({
  roomResults,
}: {
  roomResults: Map<string, RoomTakeoff>;
}) {
  const counts = useMemo(() => {
    const c: Record<MeasurementCategory, number> = {
      count: 0,
      linear: 0,
      area: 0,
      volume: 0,
    };
    roomResults.forEach((room) => {
      room.items.forEach((item) => {
        c[item.category]++;
      });
    });
    return c;
  }, [roomResults]);

  return (
    <div className="flex flex-wrap gap-1.5">
      {(Object.entries(counts) as [MeasurementCategory, number][]).map(
        ([cat, count]) =>
          count > 0 && (
            <Badge key={cat} variant="secondary" className={categoryConfig[cat].className}>
              {categoryConfig[cat].label}: {count}
            </Badge>
          )
      )}
    </div>
  );
}

function RoomSection({
  room,
  isActive,
}: {
  room: RoomTakeoff;
  isActive: boolean;
}) {
  const [expanded, setExpanded] = useState(true);

  if (room.items.length === 0) return null;

  return (
    <div
      className={`overflow-hidden rounded-xl border ${
        isActive ? "border-[#c2410c]/30 bg-[rgba(194,65,12,0.02)]" : "border-[#e2d5c3]"
      }`}
    >
      {/* Room header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-2 px-4 py-2.5 text-left hover:bg-[#faf7f2]"
      >
        {expanded ? (
          <ChevronDown className="size-3.5 shrink-0 text-[#78716c]" />
        ) : (
          <ChevronRight className="size-3.5 shrink-0 text-[#78716c]" />
        )}
        <span className="earth-serif text-sm font-semibold text-[#292018]">
          {room.space_name}
        </span>
        <Badge variant="secondary" className="ml-auto bg-[#f3ece1] text-[10px] text-[#78716c]">
          {room.items.length} items
        </Badge>
      </button>

      {/* Items table */}
      {expanded && (
        <div className="border-t border-[#e2d5c3]">
          <ItemsTable items={room.items} />
        </div>
      )}
    </div>
  );
}

function TradeSection({ analysis }: { analysis: TradeAnalysis }) {
  const [expanded, setExpanded] = useState(true);

  if (analysis.items.length === 0 && analysis.recommendations.length === 0) {
    return null;
  }

  const tradeColors: Record<string, string> = {
    electrical: "border-yellow-300 bg-yellow-50/50",
    plumbing: "border-blue-300 bg-blue-50/50",
    hvac: "border-cyan-300 bg-cyan-50/50",
    structural: "border-stone-300 bg-stone-50/50",
    finishes: "border-pink-300 bg-pink-50/50",
  };

  const colorClass = tradeColors[analysis.trade] || "border-[#e2d5c3]";

  return (
    <div className={`overflow-hidden rounded-xl border ${colorClass}`}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-2 px-4 py-2.5 text-left hover:opacity-80"
      >
        {expanded ? (
          <ChevronDown className="size-3.5 shrink-0 text-[#78716c]" />
        ) : (
          <ChevronRight className="size-3.5 shrink-0 text-[#78716c]" />
        )}
        <span className="earth-serif text-sm font-semibold capitalize text-[#292018]">
          {analysis.trade} Deep-Dive
        </span>
        <Badge variant="secondary" className="ml-auto text-[10px]">
          {analysis.items.length} items
        </Badge>
      </button>

      {expanded && (
        <div className="border-t border-inherit">
          {analysis.items.length > 0 && <ItemsTable items={analysis.items} />}

          {/* Recommendations */}
          {analysis.recommendations.length > 0 && (
            <div className="border-t border-inherit px-4 py-3">
              <p className="mb-1.5 text-xs font-semibold text-[#292018]">
                Recommendations
              </p>
              <ul className="space-y-1">
                {analysis.recommendations.map((rec, i) => (
                  <li key={i} className="flex items-start gap-1.5 text-xs text-[#78716c]">
                    <span className="mt-0.5 text-[#c2410c]">&bull;</span>
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Code references */}
          {analysis.code_references.length > 0 && (
            <div className="border-t border-inherit px-4 py-3">
              <p className="mb-1.5 text-xs font-semibold text-[#292018]">
                Code References
              </p>
              <div className="flex flex-wrap gap-1">
                {analysis.code_references.map((ref, i) => (
                  <Badge key={i} variant="outline" className="text-[10px]">
                    {ref}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ItemsTable({ items }: { items: TakeoffItem[] }) {
  const sorted = useMemo(() => {
    return [...items].sort((a, b) => {
      const order: MeasurementCategory[] = ["count", "linear", "area", "volume"];
      if (a.category !== b.category) {
        return order.indexOf(a.category) - order.indexOf(b.category);
      }
      return a.name.localeCompare(b.name);
    });
  }, [items]);

  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead className="w-[40%] py-2 text-xs">Item</TableHead>
          <TableHead className="py-2 text-xs">Type</TableHead>
          <TableHead className="py-2 text-right text-xs">Qty</TableHead>
          <TableHead className="hidden py-2 text-right text-xs sm:table-cell">
            Confidence
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sorted.map((item, idx) => (
          <TableRow key={`${item.name}-${idx}`} className={idx % 2 === 0 ? "earth-table-row-even" : ""}>
            <TableCell className="py-1.5">
              <p className="text-xs font-medium">{item.name}</p>
              {item.notes && (
                <p className="text-[10px] text-[#a8a29e]">{item.notes}</p>
              )}
            </TableCell>
            <TableCell className="py-1.5">
              <Badge variant="secondary" className={`text-[10px] ${categoryConfig[item.category].className}`}>
                {categoryConfig[item.category].label}
              </Badge>
            </TableCell>
            <TableCell className="py-1.5 text-right">
              <span className="font-mono text-xs tabular-nums">
                {item.quantity.toLocaleString()}
              </span>
              <span className="ml-1 text-[10px] text-[#a8a29e]">{item.unit}</span>
            </TableCell>
            <TableCell className="hidden py-1.5 text-right sm:table-cell">
              <ConfidenceDot value={item.confidence} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function ConfidenceDot({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  let color = "bg-red-400";
  if (pct >= 80) color = "bg-emerald-400";
  else if (pct >= 60) color = "bg-amber-400";

  return (
    <div className="flex items-center justify-end gap-1">
      <div className={`size-1.5 rounded-full ${color}`} />
      <span className="text-[10px] tabular-nums text-[#a8a29e]">{pct}%</span>
    </div>
  );
}

function GroupedTableSkeleton() {
  return (
    <div className="space-y-3">
      <div className="flex gap-1.5">
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="h-5 w-14 rounded-full" />
      </div>
      {Array.from({ length: 2 }).map((_, i) => (
        <div key={i} className="rounded-xl border border-[#e2d5c3] p-4">
          <Skeleton className="mb-3 h-5 w-32" />
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, j) => (
              <Skeleton key={j} className="h-4 w-full" />
            ))}
          </div>
        </div>
      ))}
      <p className="text-center text-xs text-[#a8a29e]">
        Scanning rooms... waiting for results
      </p>
    </div>
  );
}
