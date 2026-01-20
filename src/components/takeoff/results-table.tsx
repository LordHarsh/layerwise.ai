"use client";

import { useMemo } from "react";
import type { TakeoffItem, MeasurementCategory } from "@/types";

interface ResultsTableProps {
  items: TakeoffItem[];
  isStreaming?: boolean;
}

const categoryColors: Record<MeasurementCategory, string> = {
  count: "bg-purple-100 text-purple-800",
  linear: "bg-blue-100 text-blue-800",
  area: "bg-green-100 text-green-800",
  volume: "bg-orange-100 text-orange-800",
};

const categoryLabels: Record<MeasurementCategory, string> = {
  count: "Count",
  linear: "Linear",
  area: "Area",
  volume: "Volume",
};

export function ResultsTable({ items, isStreaming }: ResultsTableProps) {
  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => {
      // Sort by category first, then by name
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
    return (
      <div className="rounded-lg border bg-neutral-50 p-8 text-center">
        <p className="text-neutral-500">
          {isStreaming ? "Waiting for results..." : "No items found"}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary badges */}
      <div className="flex flex-wrap gap-2">
        {(Object.entries(summary) as [MeasurementCategory, number][]).map(
          ([category, count]) =>
            count > 0 && (
              <span
                key={category}
                className={`rounded-full px-3 py-1 text-sm font-medium ${categoryColors[category]}`}
              >
                {categoryLabels[category]}: {count}
              </span>
            )
        )}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-lg border">
        <table className="min-w-full divide-y divide-neutral-200">
          <thead className="bg-neutral-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">
                Item
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">
                Type
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-neutral-500">
                Quantity
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">
                Location
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-neutral-500">
                Confidence
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200 bg-white">
            {sortedItems.map((item, index) => (
              <tr
                key={`${item.name}-${index}`}
                className={isStreaming && index === sortedItems.length - 1 ? "animate-pulse bg-blue-50" : ""}
              >
                <td className="whitespace-nowrap px-4 py-3">
                  <div>
                    <p className="font-medium text-neutral-900">{item.name}</p>
                    {item.notes && (
                      <p className="text-xs text-neutral-500">{item.notes}</p>
                    )}
                  </div>
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  <span
                    className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${categoryColors[item.category]}`}
                  >
                    {categoryLabels[item.category]}
                  </span>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right">
                  <span className="font-mono text-neutral-900">
                    {item.quantity.toLocaleString()}
                  </span>
                  <span className="ml-1 text-neutral-500">{item.unit}</span>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-neutral-500">
                  {item.location || "—"}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right">
                  <ConfidenceBadge value={item.confidence} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isStreaming && (
        <p className="text-center text-sm text-neutral-500">
          Analyzing... more items may appear
        </p>
      )}
    </div>
  );
}

function ConfidenceBadge({ value }: { value: number }) {
  const percentage = Math.round(value * 100);

  let colorClass = "bg-red-100 text-red-800";
  if (percentage >= 80) {
    colorClass = "bg-green-100 text-green-800";
  } else if (percentage >= 60) {
    colorClass = "bg-yellow-100 text-yellow-800";
  }

  return (
    <span className={`inline-flex rounded px-2 py-0.5 text-xs font-medium ${colorClass}`}>
      {percentage}%
    </span>
  );
}
