"use client";

import { FileText, Ruler, Layers, Gauge } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { DocumentIntelligence } from "@/types";

interface DocIntelligenceCardProps {
  data: DocumentIntelligence;
}

const complexityConfig = {
  simple: { label: "Simple", className: "bg-green-100 text-green-800" },
  moderate: { label: "Moderate", className: "bg-amber-100 text-amber-800" },
  complex: { label: "Complex", className: "bg-red-100 text-red-800" },
};

export function DocIntelligenceCard({ data }: DocIntelligenceCardProps) {
  const complexity = complexityConfig[data.complexity] || complexityConfig.moderate;

  return (
    <div className="space-y-3">
      {/* Doc type + complexity */}
      <div className="flex items-center gap-2">
        <Badge variant="secondary" className="bg-[#f3ece1] text-[#78716c]">
          <FileText className="mr-1 size-3" />
          {data.doc_type}
        </Badge>
        <Badge variant="secondary" className={complexity.className}>
          <Gauge className="mr-1 size-3" />
          {complexity.label}
        </Badge>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-2">
        <StatBox
          icon={<FileText className="size-3.5 text-[#78716c]" />}
          label="Pages"
          value={data.page_count.toString()}
        />
        <StatBox
          icon={<Layers className="size-3.5 text-[#78716c]" />}
          label="Rooms"
          value={`~${data.estimated_rooms}`}
        />
        <StatBox
          icon={<Ruler className="size-3.5 text-[#78716c]" />}
          label="Scale"
          value={data.scale?.scale_string || "N/A"}
          small
        />
      </div>

      {/* Drawing types */}
      {data.drawing_types.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {data.drawing_types.map((dt) => (
            <Badge
              key={dt}
              variant="outline"
              className="border-[#e2d5c3] text-[10px] text-[#78716c]"
            >
              {dt}
            </Badge>
          ))}
        </div>
      )}

      {/* Notes */}
      {data.notes.length > 0 && (
        <div className="space-y-1">
          {data.notes.slice(0, 2).map((note, i) => (
            <p key={i} className="text-[11px] leading-tight text-[#a8a29e]">
              {note}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

function StatBox({
  icon,
  label,
  value,
  small,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  small?: boolean;
}) {
  return (
    <div className="rounded-lg border border-[#e2d5c3] bg-[#faf7f2] p-2">
      <div className="mb-1 flex items-center gap-1">
        {icon}
        <span className="text-[10px] text-[#a8a29e]">{label}</span>
      </div>
      <p
        className={`font-medium tabular-nums text-[#292018] ${
          small ? "text-[11px]" : "text-sm"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
