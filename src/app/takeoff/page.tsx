"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { UserButton, useAuth } from "@clerk/nextjs";
import {
  Layers,
  Play,
  Download,
  RotateCcw,
  FileSearch,
  CheckCircle2,
  Loader2,
  ChevronRight,
  Ruler,
  Sparkles,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

import { UploadZone, ResultsTable, ProgressBar, ScaleInput } from "@/components/takeoff";
import { useTakeoffStream } from "@/hooks/use-takeoff-stream";

export default function TakeoffPage() {
  const { userId } = useAuth();
  const [projectId, setProjectId] = useState(() => crypto.randomUUID());
  const [blueprintUrl, setBlueprintUrl] = useState<string | null>(null);
  const [blueprintName, setBlueprintName] = useState<string | null>(null);
  const [scale, setScale] = useState<string>("");

  const {
    status,
    progress,
    scale: detectedScale,
    items,
    summary,
    error,
    startTakeoff,
    reset,
  } = useTakeoffStream();

  const handleUploadComplete = useCallback((url: string, filename: string) => {
    setBlueprintUrl(url);
    setBlueprintName(filename);
  }, []);

  const handleStartAnalysis = useCallback(() => {
    if (!blueprintUrl) return;
    startTakeoff(blueprintUrl, scale || undefined);
  }, [blueprintUrl, scale, startTakeoff]);

  const handleReset = useCallback(() => {
    reset();
    setBlueprintUrl(null);
    setBlueprintName(null);
    setScale("");
    setProjectId(crypto.randomUUID());
  }, [reset]);

  const handleExportCSV = useCallback(() => {
    if (items.length === 0) return;

    const headers = ["Name", "Category", "Quantity", "Unit", "Location", "Confidence"];
    const rows = items.map((item) => [
      item.name,
      item.category,
      item.quantity.toString(),
      item.unit,
      item.location || "",
      (item.confidence * 100).toFixed(0) + "%",
    ]);

    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `takeoff-${blueprintName || "export"}.csv`;
    a.click();

    URL.revokeObjectURL(url);
  }, [items, blueprintName]);

  const isAnalyzing = status === "connecting" || status === "streaming";
  const hasResults = items.length > 0;

  const step1Complete = !!blueprintUrl;
  const step2Active = step1Complete;
  const step3Active = step1Complete;

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
            {/* Breadcrumb */}
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
          <div className="flex items-center gap-3">
            <span className="hidden text-sm font-medium text-[#78716c] sm:block">
              New Takeoff
            </span>
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="grid gap-8 lg:grid-cols-[360px_1fr]">
          {/* Left column - Configuration */}
          <div className="space-y-5">
            {/* Step 1: Upload */}
            <div
              className="earth-shadow-sm earth-fade-up rounded-2xl border border-[#e2d5c3] bg-white p-6"
            >
              <div className="mb-4 flex items-center gap-3">
                <StepIndicator step={1} complete={step1Complete} active={!step1Complete} />
                <div>
                  <h3 className="earth-serif text-sm font-semibold text-[#292018]">
                    Upload Blueprint
                  </h3>
                  <p className="text-xs text-[#a8a29e]">
                    PDF or image up to 50MB
                  </p>
                </div>
              </div>
              <UploadZone
                onUploadComplete={handleUploadComplete}
                disabled={isAnalyzing}
                userId={userId || undefined}
                projectId={projectId}
              />
            </div>

            {/* Step 2: Scale */}
            <div
              className={`earth-shadow-sm earth-fade-up earth-fade-up-delay-1 rounded-2xl border border-[#e2d5c3] bg-white p-6 ${
                !step2Active ? "pointer-events-none opacity-50" : ""
              }`}
            >
              <div className="mb-4 flex items-center gap-3">
                <StepIndicator step={2} complete={false} active={step2Active} />
                <div>
                  <h3 className="earth-serif text-sm font-semibold text-[#292018]">
                    Set Scale
                  </h3>
                  <p className="text-xs text-[#a8a29e]">
                    Select or auto-detect scale
                  </p>
                </div>
              </div>
              <ScaleInput
                detectedScale={detectedScale}
                value={scale}
                onChange={setScale}
                disabled={isAnalyzing || !step2Active}
              />
            </div>

            {/* Step 3: Analyze */}
            <div
              className={`earth-shadow-sm earth-fade-up earth-fade-up-delay-2 rounded-2xl border border-[#e2d5c3] bg-white p-6 ${
                !step3Active ? "pointer-events-none opacity-50" : ""
              }`}
            >
              <div className="mb-4 flex items-center gap-3">
                <StepIndicator
                  step={3}
                  complete={status === "complete"}
                  active={step3Active}
                  loading={isAnalyzing}
                />
                <div>
                  <h3 className="earth-serif text-sm font-semibold text-[#292018]">
                    Run Analysis
                  </h3>
                  <p className="text-xs text-[#a8a29e]">
                    {isAnalyzing
                      ? "Analyzing blueprint..."
                      : status === "complete"
                        ? "Analysis complete"
                        : "Extract quantities & measurements"}
                  </p>
                </div>
              </div>
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

                {(hasResults || status === "error") && (
                  <Button variant="outline" onClick={handleReset} className="rounded-full">
                    <RotateCcw className="size-4" />
                    Reset
                  </Button>
                )}
              </div>

              {/* Progress */}
              {(isAnalyzing || status === "complete") && (
                <div className="mt-4">
                  <ProgressBar progress={progress} status={status} />
                </div>
              )}
            </div>
          </div>

          {/* Right column - Results */}
          <div className="space-y-5">
            <div className="earth-shadow earth-fade-up earth-fade-up-delay-1 overflow-hidden rounded-2xl border border-[#e2d5c3] bg-white">
              {/* Results Header */}
              <div className="flex items-center justify-between border-b border-[#e2d5c3] px-6 py-5">
                <div className="flex items-center gap-3">
                  <div className="flex size-9 items-center justify-center rounded-lg bg-[#f3ece1]">
                    <FileSearch className="size-5 text-[#78716c]" />
                  </div>
                  <div>
                    <h2 className="earth-serif text-lg font-semibold text-[#292018]">
                      Results
                    </h2>
                    <p className="text-xs text-[#78716c]">
                      {blueprintName || "Upload a blueprint to begin"}
                    </p>
                  </div>
                </div>

                {hasResults && status === "complete" && (
                  <button
                    onClick={handleExportCSV}
                    className="earth-btn-outline flex items-center gap-2 !px-5 !py-2 text-sm"
                  >
                    <Download className="size-4" />
                    Export CSV
                  </button>
                )}
              </div>

              <div className="p-6">
                {/* Error message */}
                {error && (
                  <div className="mb-4 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-3">
                    <div className="mt-0.5 size-2 shrink-0 rounded-full bg-red-500" />
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                )}

                {/* Scale detection result */}
                {detectedScale && !scale && (
                  <div className="mb-4 flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 p-3">
                    <div className="mt-0.5 size-2 shrink-0 rounded-full bg-blue-500" />
                    <div>
                      <p className="text-sm text-blue-900">
                        {detectedScale.detected ? (
                          <>
                            Scale detected: <strong>{detectedScale.scale}</strong>
                            {" "}
                            <Badge variant="secondary" className="ml-1 text-xs">
                              {Math.round((detectedScale.confidence || 0) * 100)}% confident
                            </Badge>
                          </>
                        ) : (
                          <>Scale could not be auto-detected. Please set manually.</>
                        )}
                      </p>
                      {detectedScale.reasoning && (
                        <p className="mt-1 text-xs text-blue-700">
                          {detectedScale.reasoning}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Results table */}
                <ResultsTable items={items} isStreaming={isAnalyzing} />

                {/* Summary */}
                {summary && status === "complete" && (
                  <>
                    <div className="my-6">
                      <div className="earth-divider">
                        <div className="earth-divider-diamond" />
                      </div>
                    </div>
                    <div>
                      <h3 className="earth-serif mb-3 text-sm font-semibold text-[#292018]">
                        Summary
                      </h3>
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                        <SummaryCard label="Total Items" value={summary.total_items} />
                        {Object.entries(summary.summary || {}).slice(0, 3).map(([key, value]) => (
                          <SummaryCard
                            key={key}
                            label={key}
                            value={typeof value === "number" ? value : 0}
                          />
                        ))}
                      </div>
                      {summary.notes && summary.notes.length > 0 && (
                        <div className="earth-parchment mt-4 rounded-xl p-4">
                          <p className="earth-serif mb-1.5 text-xs font-semibold text-[#292018]">
                            Notes
                          </p>
                          <ul className="space-y-1">
                            {summary.notes.map((note, i) => (
                              <li key={i} className="flex items-start gap-2 text-xs text-[#78716c]">
                                <span className="text-[#c2410c]">&bull;</span>
                                {note}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </>
                )}

                {/* Empty state */}
                {!hasResults && status === "idle" && (
                  <div className="flex flex-col items-center justify-center py-20">
                    <div className="flex size-16 items-center justify-center rounded-2xl bg-[rgba(194,65,12,0.08)]">
                      <FileSearch className="size-7 text-[#c2410c]" />
                    </div>
                    <p className="earth-serif mt-4 text-lg italic text-[#78716c]">
                      No results yet
                    </p>
                    <p className="mt-1.5 max-w-xs text-center text-sm text-[#a8a29e]">
                      Upload a blueprint, set the scale, and click &quot;Start Takeoff&quot; to extract quantities.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

/* ── Sub-components ── */

function StepIndicator({
  step,
  complete,
  active,
  loading,
}: {
  step: number;
  complete: boolean;
  active: boolean;
  loading?: boolean;
}) {
  if (loading) {
    return (
      <div className="flex size-8 shrink-0 items-center justify-center rounded-full border-2 border-[#c2410c] bg-[rgba(194,65,12,0.1)]">
        <Loader2 className="size-4 animate-spin text-[#c2410c]" />
      </div>
    );
  }

  if (complete) {
    return (
      <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#166534]">
        <CheckCircle2 className="size-4 text-white" />
      </div>
    );
  }

  if (active) {
    return (
      <div className="flex size-8 shrink-0 items-center justify-center rounded-full border-2 border-[#c2410c] bg-[rgba(194,65,12,0.1)]">
        <span className="earth-serif text-xs font-bold text-[#c2410c]">{step}</span>
      </div>
    );
  }

  return (
    <div className="flex size-8 shrink-0 items-center justify-center rounded-full border-2 border-[#e2d5c3]">
      <span className="earth-serif text-xs font-bold text-[#a8a29e]">{step}</span>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="earth-parchment rounded-xl border border-[#e2d5c3] p-3">
      <p className="earth-serif text-2xl font-bold tabular-nums tracking-tight text-[#292018]">
        {value.toLocaleString()}
      </p>
      <p className="text-xs text-[#78716c]">{label}</p>
    </div>
  );
}
