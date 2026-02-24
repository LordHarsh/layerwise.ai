"use client";

import { useState, useCallback, useMemo, useEffect, Suspense } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { UserButton, useAuth } from "@clerk/nextjs";
import {
  Layers,
  Play,
  Download,
  RotateCcw,
  FileSearch,
  Loader2,
  ChevronRight,
  Map,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import {
  UploadZone,
  ScaleInput,
  PhaseTracker,
  DocIntelligenceCard,
  SpaceList,
  TradeButtons,
  GroupedResultsTable,
  PastUploads,
} from "@/components/takeoff";

const BlueprintViewer = dynamic(
  () => import("@/components/takeoff/blueprint-viewer").then((m) => m.BlueprintViewer),
  { ssr: false }
);
import { usePipelineStream } from "@/hooks/use-pipeline-stream";
import { useTradeDeepDive } from "@/hooks/use-trade-deepdive";
import type { TradeAnalysis } from "@/types";

export default function TakeoffPage() {
  return (
    <Suspense>
      <TakeoffPageContent />
    </Suspense>
  );
}

function TakeoffPageContent() {
  const { userId } = useAuth();
  const searchParams = useSearchParams();
  const [projectId, setProjectId] = useState(() => crypto.randomUUID());
  const [blueprintUrl, setBlueprintUrl] = useState<string | null>(null);
  const [blueprintName, setBlueprintName] = useState<string | null>(null);
  const [scale, setScale] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"results" | "blueprint">("results");
  const [selectedItemIndex, setSelectedItemIndex] = useState<number | null>(null);

  const pipeline = usePipelineStream();
  const tradeDeepDive = useTradeDeepDive();

  // Pre-populate from ?url= query param (e.g. from dashboard links)
  useEffect(() => {
    const urlParam = searchParams.get("url");
    if (urlParam && !blueprintUrl) {
      setBlueprintUrl(urlParam);
      // Extract filename from URL
      try {
        const pathname = new URL(urlParam).pathname;
        const filename = decodeURIComponent(pathname.split("/").pop() || "blueprint");
        setBlueprintName(filename);
      } catch {
        setBlueprintName("blueprint");
      }
    }
  }, [searchParams, blueprintUrl]);

  const handleUploadComplete = useCallback((url: string, filename: string) => {
    setBlueprintUrl(url);
    setBlueprintName(filename);
  }, []);

  const handleStartAnalysis = useCallback(() => {
    if (!blueprintUrl) return;
    pipeline.startPipeline(blueprintUrl, scale || undefined);
  }, [blueprintUrl, scale, pipeline]);

  const handleReset = useCallback(() => {
    pipeline.reset();
    tradeDeepDive.resetAll();
    setBlueprintUrl(null);
    setBlueprintName(null);
    setScale("");
    setActiveTab("results");
    setSelectedItemIndex(null);
    setProjectId(crypto.randomUUID());
  }, [pipeline, tradeDeepDive]);

  const handleTradeClick = useCallback(
    (trade: string) => {
      if (!blueprintUrl) return;
      const tradeState = tradeDeepDive.getTradeState(trade);
      // Don't re-run if already loading or complete
      if (tradeState.status === "loading" || tradeState.status === "complete") return;

      const detectedScale = pipeline.docIntelligence?.scale?.scale_string;
      tradeDeepDive.startDeepDive(
        blueprintUrl,
        trade,
        pipeline.spaces,
        scale || detectedScale || undefined
      );
    },
    [blueprintUrl, scale, pipeline.docIntelligence, pipeline.spaces, tradeDeepDive]
  );

  const getTradeStatus = useCallback(
    (trade: string) => tradeDeepDive.getTradeState(trade).status,
    [tradeDeepDive]
  );

  const getTradeItemCount = useCallback(
    (trade: string) => tradeDeepDive.getTradeState(trade).result?.items.length ?? 0,
    [tradeDeepDive]
  );

  // Build trade results map for the grouped table
  const tradeResultsMap = useMemo(() => {
    const entries: [string, TradeAnalysis][] = [];
    tradeDeepDive.results.forEach((state, trade) => {
      if (state.result) {
        entries.push([trade, state.result]);
      }
    });
    return new globalThis.Map(entries);
  }, [tradeDeepDive.results]);

  const handleExportCSV = useCallback(() => {
    const allItems = pipeline.allItems;
    // Also include trade deep-dive items
    tradeDeepDive.results.forEach((state) => {
      if (state.result) {
        allItems.push(...state.result.items);
      }
    });

    if (allItems.length === 0) return;

    const headers = ["Name", "Category", "Quantity", "Unit", "Location", "Confidence", "Page", "BBox"];
    const rows = allItems.map((item) => [
      `"${item.name.replace(/"/g, '""')}"`,
      item.category,
      item.quantity.toString(),
      item.unit,
      item.location || "",
      (item.confidence * 100).toFixed(0) + "%",
      item.page_number.toString(),
      item.bbox ? `"${item.bbox.join(",")}"` : "",
    ]);

    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `takeoff-${blueprintName || "export"}.csv`;
    a.click();

    URL.revokeObjectURL(url);
  }, [pipeline.allItems, tradeDeepDive.results, blueprintName]);

  const isAnalyzing =
    pipeline.status === "connecting" ||
    pipeline.status === "phase-1" ||
    pipeline.status === "phase-2" ||
    pipeline.status === "phase-3";
  const hasResults = pipeline.allItems.length > 0;
  const hasTradeResults = tradeResultsMap.size > 0;

  // Detect scale from pipeline or manual input
  const detectedScaleEvent =
    pipeline.docIntelligence?.scale
      ? {
          detected: true,
          scale: pipeline.docIntelligence.scale.scale_string,
          confidence: pipeline.docIntelligence.scale.confidence,
          reasoning: "",
        }
      : null;

  return (
    <div className="earth-linen-bg min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-[#e2d5c3] bg-[#faf7f2]">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-[#c2410c]">
                <Layers className="size-5 text-white" />
              </div>
              <span className="earth-serif text-xl font-bold text-[#292018]">
                Layerwise
              </span>
            </Link>
            <div className="ml-2 flex items-center gap-1">
              <ChevronRight className="size-4 text-[#a8a29e]" />
              <Link
                href="/dashboard"
                className="text-sm text-[#78716c] transition-colors hover:opacity-70"
              >
                Dashboard
              </Link>
              <ChevronRight className="size-4 text-[#a8a29e]" />
              <span className="text-sm font-medium text-[#292018]">
                Takeoff
              </span>
            </div>
          </div>

          {/* Phase tracker in header when analyzing */}
          {pipeline.status !== "idle" && (
            <div className="hidden md:block">
              <PhaseTracker
                status={pipeline.status}
                hasTradeResults={hasTradeResults}
              />
            </div>
          )}

          <div className="flex items-center gap-3">
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="grid gap-8 lg:grid-cols-[340px_1fr]">
          {/* ── Left Panel ── */}
          <div className="space-y-5">
            {/* Upload */}
            <div className="earth-shadow-sm earth-fade-up rounded-2xl border border-[#e2d5c3] bg-white p-5">
              <SectionHeader title="Upload Blueprint" subtitle="PDF or image up to 50MB" />
              <UploadZone
                onUploadComplete={handleUploadComplete}
                disabled={isAnalyzing}
                userId={userId || undefined}
                projectId={projectId}
              />
              {!blueprintUrl && !isAnalyzing && (
                <div className="mt-3 border-t border-[#e2d5c3] pt-3">
                  <PastUploads
                    onSelect={handleUploadComplete}
                    disabled={isAnalyzing}
                    currentUrl={blueprintUrl}
                  />
                </div>
              )}
            </div>

            {/* Scale */}
            <div
              className={`earth-shadow-sm earth-fade-up earth-fade-up-delay-1 rounded-2xl border border-[#e2d5c3] bg-white p-5 ${
                !blueprintUrl ? "pointer-events-none opacity-50" : ""
              }`}
            >
              <SectionHeader title="Scale" subtitle="Select or auto-detect" />
              <ScaleInput
                detectedScale={detectedScaleEvent}
                value={scale}
                onChange={setScale}
                disabled={isAnalyzing || !blueprintUrl}
              />
            </div>

            {/* Analyze button */}
            <div
              className={`earth-shadow-sm earth-fade-up earth-fade-up-delay-2 rounded-2xl border border-[#e2d5c3] bg-white p-5 ${
                !blueprintUrl ? "pointer-events-none opacity-50" : ""
              }`}
            >
              <div className="flex gap-2">
                <Button
                  onClick={handleStartAnalysis}
                  disabled={isAnalyzing || !blueprintUrl}
                  className="flex-1 rounded-full"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Play className="size-4" />
                      Start Takeoff
                    </>
                  )}
                </Button>

                {(hasResults || pipeline.status === "error") && (
                  <Button variant="outline" onClick={handleReset} className="rounded-full">
                    <RotateCcw className="size-4" />
                    Reset
                  </Button>
                )}
              </div>

              {/* Phase progress for mobile */}
              {pipeline.status !== "idle" && (
                <div className="mt-3 md:hidden">
                  <PhaseTracker
                    status={pipeline.status}
                    hasTradeResults={hasTradeResults}
                  />
                </div>
              )}
            </div>

            {/* Doc Intelligence Card (after Phase 1) */}
            {pipeline.docIntelligence && (
              <div className="earth-shadow-sm earth-fade-up rounded-2xl border border-[#e2d5c3] bg-white p-5">
                <SectionHeader
                  title="Document Info"
                  subtitle="AI analysis"
                />
                <DocIntelligenceCard data={pipeline.docIntelligence} />
              </div>
            )}

            {/* Space List (after Phase 2) */}
            {pipeline.spaces.length > 0 && (
              <div className="earth-shadow-sm earth-fade-up rounded-2xl border border-[#e2d5c3] bg-white p-5">
                <SectionHeader
                  title="Detected Spaces"
                  subtitle={`${pipeline.spaces.length} rooms/areas`}
                />
                <SpaceList
                  spaces={pipeline.spaces}
                  roomResults={pipeline.roomResults}
                  currentRoom={pipeline.currentRoom}
                  totalArea={
                    pipeline.spaces.reduce(
                      (sum, s) => sum + (s.area_estimate || 0),
                      0
                    ) || null
                  }
                />
              </div>
            )}

            {/* Trade Buttons (after Phase 3) */}
            {pipeline.availableTrades.length > 0 && pipeline.status === "complete" && (
              <div className="earth-shadow-sm earth-fade-up rounded-2xl border border-[#e2d5c3] bg-white p-5">
                <TradeButtons
                  availableTrades={pipeline.availableTrades}
                  getTradeStatus={getTradeStatus}
                  getTradeItemCount={getTradeItemCount}
                  onTradeClick={handleTradeClick}
                />
              </div>
            )}

            {/* Export CSV */}
            {hasResults && pipeline.status === "complete" && (
              <div className="earth-fade-up">
                <Button
                  variant="outline"
                  onClick={handleExportCSV}
                  className="w-full rounded-full"
                >
                  <Download className="size-4" />
                  Export CSV
                </Button>
              </div>
            )}
          </div>

          {/* ── Right Panel ── */}
          <div className="space-y-5">
            <div className="earth-shadow earth-fade-up earth-fade-up-delay-1 overflow-hidden rounded-2xl border border-[#e2d5c3] bg-white">
              {/* Header with tabs */}
              <div className="flex items-center justify-between border-b border-[#e2d5c3] px-6 py-5">
                <div className="flex items-center gap-3">
                  <div className="flex size-9 items-center justify-center rounded-lg bg-[#f3ece1]">
                    {activeTab === "results" ? (
                      <FileSearch className="size-5 text-[#78716c]" />
                    ) : (
                      <Map className="size-5 text-[#78716c]" />
                    )}
                  </div>
                  <div>
                    <h2 className="earth-serif text-lg font-semibold text-[#292018]">
                      {activeTab === "results" ? "Results" : "Blueprint"}
                    </h2>
                    <p className="text-xs text-[#78716c]">
                      {blueprintName || "Upload a blueprint to begin"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Tab toggle */}
                  {(hasResults || blueprintUrl) && (
                    <div className="flex rounded-full border border-[#e2d5c3] bg-[#faf7f2] p-0.5">
                      <button
                        onClick={() => setActiveTab("results")}
                        className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                          activeTab === "results"
                            ? "bg-white text-[#292018] shadow-sm"
                            : "text-[#78716c] hover:text-[#292018]"
                        }`}
                      >
                        Results
                      </button>
                      <button
                        onClick={() => setActiveTab("blueprint")}
                        className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                          activeTab === "blueprint"
                            ? "bg-white text-[#292018] shadow-sm"
                            : "text-[#78716c] hover:text-[#292018]"
                        }`}
                      >
                        Blueprint
                      </button>
                    </div>
                  )}

                  {hasResults && pipeline.status === "complete" && (
                    <Badge variant="secondary" className="bg-[#f3ece1] text-xs text-[#78716c]">
                      {pipeline.allItems.length} items
                    </Badge>
                  )}
                </div>
              </div>

              {/* Tab content */}
              {activeTab === "results" ? (
                <div className="p-6">
                  {/* Error */}
                  {pipeline.error && (
                    <div className="mb-4 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-3">
                      <div className="mt-0.5 size-2 shrink-0 rounded-full bg-red-500" />
                      <p className="text-sm text-red-700">{pipeline.error}</p>
                    </div>
                  )}

                  {/* Grouped results */}
                  <GroupedResultsTable
                    roomResults={pipeline.roomResults}
                    tradeResults={tradeResultsMap}
                    isStreaming={isAnalyzing}
                    currentRoom={pipeline.currentRoom}
                    selectedItemIndex={selectedItemIndex}
                    onItemSelect={(idx) => {
                      setSelectedItemIndex(idx);
                    }}
                  />

                  {/* Summary after completion */}
                  {pipeline.summary && pipeline.status === "complete" && (
                    <div className="mt-6">
                      <div className="earth-divider">
                        <div className="earth-divider-diamond" />
                      </div>
                      <div className="mt-6">
                        <h3 className="earth-serif mb-3 text-sm font-semibold text-[#292018]">
                          Summary
                        </h3>
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                          <SummaryCard
                            label="Total Items"
                            value={pipeline.summary.total_items}
                          />
                          <SummaryCard
                            label="Rooms Scanned"
                            value={pipeline.roomResults.size}
                          />
                          {pipeline.summary.scale_used && (
                            <SummaryCard
                              label="Scale"
                              value={pipeline.summary.scale_used}
                              isText
                            />
                          )}
                          {hasTradeResults && (
                            <SummaryCard
                              label="Trade Analyses"
                              value={tradeResultsMap.size}
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Empty state */}
                  {!hasResults && !isAnalyzing && pipeline.status === "idle" && (
                    <div className="flex flex-col items-center justify-center py-20">
                      <div className="flex size-16 items-center justify-center rounded-2xl bg-[rgba(194,65,12,0.08)]">
                        <FileSearch className="size-7 text-[#c2410c]" />
                      </div>
                      <p className="earth-serif mt-4 text-lg italic text-[#78716c]">
                        No results yet
                      </p>
                      <p className="mt-1.5 max-w-xs text-center text-sm text-[#a8a29e]">
                        Upload a blueprint, set the scale, and click &quot;Start
                        Takeoff&quot; to run the multi-phase analysis pipeline.
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  {blueprintUrl ? (
                    <BlueprintViewer
                      pdfUrl={blueprintUrl}
                      items={pipeline.allItems}
                      selectedItemIndex={selectedItemIndex}
                      onItemSelect={(idx) => {
                        setSelectedItemIndex(idx);
                        setActiveTab("results");
                      }}
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center py-20">
                      <Map className="size-7 text-[#a8a29e]" />
                      <p className="earth-serif mt-4 text-lg italic text-[#78716c]">
                        No blueprint loaded
                      </p>
                      <p className="mt-1.5 text-center text-sm text-[#a8a29e]">
                        Upload a PDF to view it here.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

/* ── Sub-components ── */

function SectionHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-3">
      <h3 className="earth-serif text-sm font-semibold text-[#292018]">{title}</h3>
      <p className="text-xs text-[#a8a29e]">{subtitle}</p>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  isText,
}: {
  label: string;
  value: number | string;
  isText?: boolean;
}) {
  return (
    <div className="earth-parchment rounded-xl border border-[#e2d5c3] p-3">
      <p
        className={`font-medium tabular-nums text-[#292018] ${
          isText ? "text-sm" : "earth-serif text-2xl tracking-tight"
        }`}
      >
        {typeof value === "number" ? value.toLocaleString() : value}
      </p>
      <p className="text-xs text-[#78716c]">{label}</p>
    </div>
  );
}
