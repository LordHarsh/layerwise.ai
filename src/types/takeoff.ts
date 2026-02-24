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
  page_number: number;
  bbox?: [number, number, number, number] | null;
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

// SSE Event types (legacy)
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

// ── Pipeline types (multi-phase) ──

export type SpaceType = "room" | "corridor" | "exterior" | "utility" | "other";

export interface DocumentIntelligence {
  doc_type: string;
  page_count: number;
  drawing_types: string[];
  scale: ScaleInfo | null;
  estimated_rooms: number;
  complexity: "simple" | "moderate" | "complex";
  notes: string[];
}

export interface Space {
  id: string;
  name: string;
  type: SpaceType;
  floor?: string | null;
  area_estimate?: number | null;
}

export interface SpaceDetectionResult {
  spaces: Space[];
  total_area_estimate?: number | null;
  floor_count: number;
}

export interface RoomTakeoff {
  space_id: string;
  space_name: string;
  items: TakeoffItem[];
  notes: string[];
}

export interface TradeAnalysis {
  trade: string;
  items: TakeoffItem[];
  recommendations: string[];
  code_references: string[];
  notes: string[];
}

// ── Pipeline SSE event payloads ──

export interface PhaseStartEvent {
  phase: number;
  name: string;
}

export interface DocIntelligenceEvent extends DocumentIntelligence {}

export interface SpacesEvent extends SpaceDetectionResult {}

export interface RoomStartEvent {
  space_id: string;
  space_name: string;
  index: number;
  total: number;
}

export interface RoomItemsEvent {
  space_id: string;
  space_name: string;
  items: TakeoffItem[];
  error?: string;
}

export interface PipelineCompleteEvent {
  total_items: number;
  summary: Record<string, number>;
  scale_used?: string | null;
  available_trades: string[];
}

// Trade deep-dive SSE event payloads
export interface TradeStartEvent {
  trade: string;
}

export interface TradeResultEvent extends TradeAnalysis {}

export interface TradeCompleteEvent {
  trade: string;
  item_count: number;
}
