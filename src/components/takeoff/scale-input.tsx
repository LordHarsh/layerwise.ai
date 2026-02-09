"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import type { ScaleEvent } from "@/types";

interface ScaleInputProps {
  detectedScale: ScaleEvent | null;
  value: string;
  onChange: (scale: string) => void;
  disabled?: boolean;
}

const commonScales = [
  { label: `1/4" = 1'-0"`, value: `1/4" = 1'-0"` },
  { label: `1/8" = 1'-0"`, value: `1/8" = 1'-0"` },
  { label: `1/2" = 1'-0"`, value: `1/2" = 1'-0"` },
  { label: `1" = 10'`, value: `1" = 10'` },
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
      {/* Auto-detect badge */}
      {detectedScale?.detected && (
        <div className="flex items-center gap-2 rounded-md bg-muted/50 px-2.5 py-1.5">
          <Sparkles className="size-3.5 text-amber-500" />
          <span className="text-xs text-muted-foreground">
            Auto-detected:{" "}
            <strong className="font-semibold text-foreground">{detectedScale.scale}</strong>
          </span>
          <Badge variant="secondary" className="ml-auto text-[10px]">
            {Math.round((detectedScale.confidence || 0) * 100)}%
          </Badge>
        </div>
      )}

      {/* Preset buttons */}
      <div className="grid grid-cols-2 gap-1.5">
        {commonScales.map((scale) => (
          <Button
            key={scale.value}
            type="button"
            variant={value === scale.value && !isCustom ? "default" : "outline"}
            size="sm"
            onClick={() => handlePresetClick(scale.value)}
            disabled={disabled}
            className="h-8 text-xs"
          >
            {scale.label}
          </Button>
        ))}
        <Button
          type="button"
          variant={isCustom ? "default" : "outline"}
          size="sm"
          onClick={() => setIsCustom(true)}
          disabled={disabled}
          className="col-span-2 h-8 text-xs"
        >
          Custom Scale
        </Button>
      </div>

      {/* Custom input */}
      {isCustom && (
        <Input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={`Enter scale (e.g., 1/4" = 1'-0")`}
          disabled={disabled}
          className="h-8 text-xs"
        />
      )}

      {/* Auto-detect failure */}
      {detectedScale && !detectedScale.detected && (
        <p className="text-xs text-amber-600 dark:text-amber-400">
          Could not auto-detect scale. Please select or enter manually.
        </p>
      )}
    </div>
  );
}
