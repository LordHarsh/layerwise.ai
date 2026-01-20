"use client";

import { useState } from "react";
import type { ScaleEvent } from "@/types";

interface ScaleInputProps {
  detectedScale: ScaleEvent | null;
  value: string;
  onChange: (scale: string) => void;
  disabled?: boolean;
}

const commonScales = [
  { label: '1/4" = 1\'-0"', value: '1/4" = 1\'-0"' },
  { label: '1/8" = 1\'-0"', value: '1/8" = 1\'-0"' },
  { label: '1/2" = 1\'-0"', value: '1/2" = 1\'-0"' },
  { label: '1" = 10\'', value: '1" = 10\'' },
  { label: "1:50", value: "1:50" },
  { label: "1:100", value: "1:100" },
];

export function ScaleInput({
  detectedScale,
  value,
  onChange,
  disabled,
}: ScaleInputProps) {
  const [isCustom, setIsCustom] = useState(false);

  const handlePresetClick = (scale: string) => {
    setIsCustom(false);
    onChange(scale);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-neutral-700">
          Blueprint Scale
        </label>
        {detectedScale?.detected && (
          <span className="text-xs text-green-600">
            Auto-detected: {detectedScale.scale} ({Math.round((detectedScale.confidence || 0) * 100)}% confident)
          </span>
        )}
      </div>

      {/* Quick select buttons */}
      <div className="flex flex-wrap gap-2">
        {commonScales.map((scale) => (
          <button
            key={scale.value}
            type="button"
            onClick={() => handlePresetClick(scale.value)}
            disabled={disabled}
            className={`rounded-md border px-3 py-1.5 text-sm transition-colors ${
              value === scale.value && !isCustom
                ? "border-blue-500 bg-blue-50 text-blue-700"
                : "border-neutral-300 hover:border-neutral-400"
            } ${disabled ? "cursor-not-allowed opacity-50" : ""}`}
          >
            {scale.label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setIsCustom(true)}
          disabled={disabled}
          className={`rounded-md border px-3 py-1.5 text-sm transition-colors ${
            isCustom
              ? "border-blue-500 bg-blue-50 text-blue-700"
              : "border-neutral-300 hover:border-neutral-400"
          } ${disabled ? "cursor-not-allowed opacity-50" : ""}`}
        >
          Custom
        </button>
      </div>

      {/* Custom input */}
      {isCustom && (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder='Enter scale (e.g., 1/4" = 1\'-0")'
          disabled={disabled}
          className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      )}

      {/* Auto-detect info */}
      {detectedScale && !detectedScale.detected && (
        <p className="text-xs text-amber-600">
          Could not auto-detect scale. Please select or enter manually.
        </p>
      )}
    </div>
  );
}
