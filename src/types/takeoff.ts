/**
 * TypeScript types matching Python Pydantic models
 */

export type MeasurementCategory = "count" | "linear" | "area" | "volume";

export interface TakeoffItem {
  name: string;
  category: MeasurementCategory;
  quantity: number;
  unit: string;
  location?: string | null;
  notes?: string | null;
  confidence: number;
}

export interface TakeoffResult {
  items: TakeoffItem[];
  summary: Record<string, number>;
  notes: string[];
  scale_used?: string | null;
  page_count: number;
}

export interface TakeoffRequest {
  blueprint_url: string;
  scale?: string | null;
  auto_detect_scale?: boolean;
  focus_areas?: string[] | null;
}

export interface ScaleInfo {
  scale_string: string;
  pixels_per_foot?: number | null;
  confidence: number;
  source: "auto" | "manual" | "inferred";
}

export interface BlueprintMeta {
  url: string;
  filename: string;
  page_count: number;
  width_px?: number | null;
  height_px?: number | null;
  scale?: ScaleInfo | null;
  drawing_type?: string | null;
}

// SSE Event types
export interface ProgressEvent {
  current: number;
  total: number;
  percentage: number;
  message: string;
}

export interface ScaleEvent {
  detected: boolean;
  scale?: string;
  confidence?: number;
  reasoning: string;
}

export interface ErrorEvent {
  code: string;
  message: string;
}

export interface CompleteEvent {
  total_items: number;
  summary: Record<string, number>;
  notes: string[];
  scale_used?: string | null;
}
