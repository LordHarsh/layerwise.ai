"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { ArrowLeft, Play, Download, RotateCcw } from "lucide-react";

import { UploadZone, ResultsTable, ProgressBar, ScaleInput } from "@/components/takeoff";
import { useTakeoffStream } from "@/hooks/use-takeoff-stream";

export default function TakeoffPage() {
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

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 text-neutral-600 hover:text-neutral-900"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="text-sm">Dashboard</span>
            </Link>
            <h1 className="text-xl font-semibold">New Takeoff</h1>
          </div>
          <UserButton afterSignOutUrl="/" />
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Left column - Upload & Settings */}
          <div className="lg:col-span-1">
            <div className="space-y-6 rounded-lg border bg-white p-6 shadow-sm">
              <div>
                <h2 className="text-lg font-semibold text-neutral-900">
                  1. Upload Blueprint
                </h2>
                <p className="mt-1 text-sm text-neutral-500">
                  Upload a PDF or image of your construction blueprint.
                </p>
              </div>

              <UploadZone
                onUploadComplete={handleUploadComplete}
                disabled={isAnalyzing}
              />

              {blueprintUrl && (
                <>
                  <div className="border-t pt-6">
                    <h2 className="text-lg font-semibold text-neutral-900">
                      2. Set Scale
                    </h2>
                    <p className="mt-1 text-sm text-neutral-500">
                      Select or enter the blueprint scale for accurate measurements.
                    </p>
                  </div>

                  <ScaleInput
                    detectedScale={detectedScale}
                    value={scale}
                    onChange={setScale}
                    disabled={isAnalyzing}
                  />

                  <div className="border-t pt-6">
                    <h2 className="text-lg font-semibold text-neutral-900">
                      3. Run Analysis
                    </h2>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={handleStartAnalysis}
                      disabled={isAnalyzing}
                      className="flex flex-1 items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Play className="h-4 w-4" />
                      {isAnalyzing ? "Analyzing..." : "Start Takeoff"}
                    </button>

                    {(hasResults || status === "error") && (
                      <button
                        onClick={handleReset}
                        className="flex items-center justify-center gap-2 rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
                      >
                        <RotateCcw className="h-4 w-4" />
                        Reset
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Right column - Results */}
          <div className="lg:col-span-2">
            <div className="rounded-lg border bg-white p-6 shadow-sm">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-neutral-900">
                    Results
                  </h2>
                  {blueprintName && (
                    <p className="text-sm text-neutral-500">{blueprintName}</p>
                  )}
                </div>

                {hasResults && status === "complete" && (
                  <button
                    onClick={handleExportCSV}
                    className="flex items-center gap-2 rounded-md border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
                  >
                    <Download className="h-4 w-4" />
                    Export CSV
                  </button>
                )}
              </div>

              {/* Progress bar */}
              {(isAnalyzing || status === "complete") && (
                <div className="mb-6">
                  <ProgressBar progress={progress} status={status} />
                </div>
              )}

              {/* Error message */}
              {error && (
                <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              {/* Scale detection result */}
              {detectedScale && !scale && (
                <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
                  <p className="text-sm text-blue-700">
                    {detectedScale.detected ? (
                      <>
                        Scale detected: <strong>{detectedScale.scale}</strong>{" "}
                        ({Math.round((detectedScale.confidence || 0) * 100)}% confidence)
                      </>
                    ) : (
                      <>Scale could not be auto-detected. Please set manually.</>
                    )}
                  </p>
                  {detectedScale.reasoning && (
                    <p className="mt-1 text-xs text-blue-600">
                      {detectedScale.reasoning}
                    </p>
                  )}
                </div>
              )}

              {/* Results table */}
              <ResultsTable items={items} isStreaming={isAnalyzing} />

              {/* Summary */}
              {summary && status === "complete" && (
                <div className="mt-6 rounded-lg bg-neutral-50 p-4">
                  <h3 className="text-sm font-medium text-neutral-900">Summary</h3>
                  <div className="mt-2 grid grid-cols-2 gap-4 sm:grid-cols-4">
                    <div>
                      <p className="text-2xl font-bold text-neutral-900">
                        {summary.total_items}
                      </p>
                      <p className="text-xs text-neutral-500">Total Items</p>
                    </div>
                    {Object.entries(summary.summary || {}).slice(0, 3).map(([key, value]) => (
                      <div key={key}>
                        <p className="text-2xl font-bold text-neutral-900">
                          {typeof value === "number" ? value.toLocaleString() : value}
                        </p>
                        <p className="text-xs text-neutral-500">{key}</p>
                      </div>
                    ))}
                  </div>
                  {summary.notes && summary.notes.length > 0 && (
                    <div className="mt-4">
                      <p className="text-xs font-medium text-neutral-700">Notes:</p>
                      <ul className="mt-1 text-xs text-neutral-600">
                        {summary.notes.map((note, i) => (
                          <li key={i}>• {note}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Empty state */}
              {!hasResults && status === "idle" && (
                <div className="py-12 text-center">
                  <p className="text-neutral-500">
                    Upload a blueprint and click "Start Takeoff" to begin analysis.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
