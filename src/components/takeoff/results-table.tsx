"use client";

import { useMemo } from "react";
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
import type { TakeoffItem, MeasurementCategory } from "@/types";

interface ResultsTableProps {
  items: TakeoffItem[];
  isStreaming?: boolean;
}

const categoryConfig: Record<MeasurementCategory, { label: string; className: string }> = {
  count: { label: "Count", className: "bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300" },
  linear: { label: "Linear", className: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300" },
  area: { label: "Area", className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300" },
  volume: { label: "Volume", className: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300" },
};

export function ResultsTable({ items, isStreaming }: ResultsTableProps) {
  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => {
      if (a.category !== b.category) {
        const order: MeasurementCategory[] = ["count", "linear", "area", "volume"];
        return order.indexOf(a.category) - order.indexOf(b.category);
      }
      return a.name.localeCompare(b.name);
    });
  }, [items]);

  const summary = useMemo(() => {
    const counts: Record<MeasurementCategory, number> = {
      count: 0,
      linear: 0,
      area: 0,
      volume: 0,
    };
    items.forEach((item) => {
      counts[item.category]++;
    });
    return counts;
  }, [items]);

  if (items.length === 0) {
    if (isStreaming) {
      return <ResultsTableSkeleton />;
    }
    return null;
  }

  return (
    <div className="space-y-3">
      {/* Summary badges */}
      <div className="flex flex-wrap gap-1.5">
        {(Object.entries(summary) as [MeasurementCategory, number][]).map(
          ([category, count]) =>
            count > 0 && (
              <Badge
                key={category}
                variant="secondary"
                className={categoryConfig[category].className}
              >
                {categoryConfig[category].label}: {count}
              </Badge>
            )
        )}
      </div>

      {/* Table */}
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-[40%]">Item</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Quantity</TableHead>
              <TableHead className="hidden sm:table-cell">Location</TableHead>
              <TableHead className="text-right">Confidence</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedItems.map((item, index) => (
              <TableRow
                key={`${item.name}-${index}`}
                className={
                  isStreaming && index === sortedItems.length - 1
                    ? "animate-in fade-in-0 bg-primary/5"
                    : ""
                }
              >
                <TableCell>
                  <div>
                    <p className="font-medium">{item.name}</p>
                    {item.notes && (
                      <p className="text-xs text-muted-foreground">{item.notes}</p>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="secondary"
                    className={categoryConfig[item.category].className}
                  >
                    {categoryConfig[item.category].label}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <span className="font-mono tabular-nums">
                    {item.quantity.toLocaleString()}
                  </span>
                  <span className="ml-1 text-muted-foreground">{item.unit}</span>
                </TableCell>
                <TableCell className="hidden text-muted-foreground sm:table-cell">
                  {item.location || "\u2014"}
                </TableCell>
                <TableCell className="text-right">
                  <ConfidenceBadge value={item.confidence} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {isStreaming && (
        <p className="text-center text-xs text-muted-foreground">
          Analyzing... more items may appear
        </p>
      )}
    </div>
  );
}

function ConfidenceBadge({ value }: { value: number }) {
  const percentage = Math.round(value * 100);

  let className = "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300";
  if (percentage >= 80) {
    className = "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300";
  } else if (percentage >= 60) {
    className = "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300";
  }

  return (
    <Badge variant="secondary" className={className}>
      {percentage}%
    </Badge>
  );
}

function ResultsTableSkeleton() {
  return (
    <div className="space-y-3">
      <div className="flex gap-1.5">
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="h-5 w-14 rounded-full" />
        <Skeleton className="h-5 w-12 rounded-full" />
      </div>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-[40%]">Item</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Quantity</TableHead>
              <TableHead className="hidden sm:table-cell">Location</TableHead>
              <TableHead className="text-right">Confidence</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 4 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                <TableCell><Skeleton className="h-5 w-14 rounded-full" /></TableCell>
                <TableCell className="text-right"><Skeleton className="ml-auto h-4 w-12" /></TableCell>
                <TableCell className="hidden sm:table-cell"><Skeleton className="h-4 w-20" /></TableCell>
                <TableCell className="text-right"><Skeleton className="ml-auto h-5 w-10 rounded-full" /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <p className="text-center text-xs text-muted-foreground">
        Analyzing... waiting for results
      </p>
    </div>
  );
}
