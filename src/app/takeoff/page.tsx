"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import {
  ArrowLeft,
  Play,
  Download,
  RotateCcw,
  FileSearch,
  Layers,
  CheckCircle2,
  Loader2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

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

  const step1Complete = !!blueprintUrl;
  const step2Active = step1Complete;
  const step3Active = step1Complete;

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard">
                <ArrowLeft className="size-4" />
                Dashboard
              </Link>
            </Button>
            <Separator orientation="vertical" className="h-5" />
            <div className="flex items-center gap-2">
              <div className="flex size-7 items-center justify-center rounded-lg bg-primary">
                <Layers className="size-4 text-primary-foreground" />
              </div>
              <h1 className="text-base font-semibold">New Takeoff</h1>
            </div>
          </div>
          <UserButton afterSignOutUrl="/" />
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
          {/* Left column - Configuration */}
          <div className="space-y-4">
            {/* Step 1: Upload */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <StepIndicator step={1} complete={step1Complete} active={!step1Complete} />
                  <div>
                    <CardTitle className="text-sm">Upload Blueprint</CardTitle>
                    <CardDescription className="text-xs">
                      PDF or image up to 50MB
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <UploadZone
                  onUploadComplete={handleUploadComplete}
                  disabled={isAnalyzing}
                />
              </CardContent>
            </Card>

            {/* Step 2: Scale */}
            <Card className={!step2Active ? "opacity-50 pointer-events-none" : ""}>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <StepIndicator step={2} complete={false} active={step2Active} />
                  <div>
                    <CardTitle className="text-sm">Set Scale</CardTitle>
                    <CardDescription className="text-xs">
                      Select or auto-detect scale
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ScaleInput
                  detectedScale={detectedScale}
                  value={scale}
                  onChange={setScale}
                  disabled={isAnalyzing || !step2Active}
                />
              </CardContent>
            </Card>

            {/* Step 3: Analyze */}
            <Card className={!step3Active ? "opacity-50 pointer-events-none" : ""}>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <StepIndicator
                    step={3}
                    complete={status === "complete"}
                    active={step3Active}
                    loading={isAnalyzing}
                  />
                  <div>
                    <CardTitle className="text-sm">Run Analysis</CardTitle>
                    <CardDescription className="text-xs">
                      {isAnalyzing
                        ? "Analyzing blueprint..."
                        : status === "complete"
                          ? "Analysis complete"
                          : "Extract quantities & measurements"}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Button
                    onClick={handleStartAnalysis}
                    disabled={isAnalyzing || !blueprintUrl}
                    className="flex-1"
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
                    <Button variant="outline" onClick={handleReset}>
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
              </CardContent>
            </Card>
          </div>

          {/* Right column - Results */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex size-9 items-center justify-center rounded-lg bg-muted">
                      <FileSearch className="size-5 text-muted-foreground" />
                    </div>
                    <div>
                      <CardTitle>Results</CardTitle>
                      <CardDescription>
                        {blueprintName || "Upload a blueprint to begin"}
                      </CardDescription>
                    </div>
                  </div>

                  {hasResults && status === "complete" && (
                    <Button variant="outline" size="sm" onClick={handleExportCSV}>
                      <Download className="size-4" />
                      Export CSV
                    </Button>
                  )}
                </div>
              </CardHeader>

              <CardContent>
                {/* Error message */}
                {error && (
                  <div className="mb-4 flex items-start gap-3 rounded-lg border border-destructive/20 bg-destructive/5 p-3">
                    <div className="mt-0.5 size-2 shrink-0 rounded-full bg-destructive" />
                    <p className="text-sm text-destructive">{error}</p>
                  </div>
                )}

                {/* Scale detection result */}
                {detectedScale && !scale && (
                  <div className="mb-4 flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-500/20 dark:bg-blue-500/5">
                    <div className="mt-0.5 size-2 shrink-0 rounded-full bg-blue-500" />
                    <div>
                      <p className="text-sm text-blue-900 dark:text-blue-200">
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
                        <p className="mt-1 text-xs text-blue-700 dark:text-blue-300">
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
                    <Separator className="my-6" />
                    <div>
                      <h3 className="mb-3 text-sm font-semibold">Summary</h3>
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
                        <div className="mt-4 rounded-lg bg-muted/50 p-3">
                          <p className="mb-1.5 text-xs font-semibold text-muted-foreground">
                            Notes
                          </p>
                          <ul className="space-y-1">
                            {summary.notes.map((note, i) => (
                              <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                                <span className="mt-1.5 size-1 shrink-0 rounded-full bg-muted-foreground/40" />
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
                  <div className="flex flex-col items-center justify-center py-16">
                    <div className="flex size-12 items-center justify-center rounded-full bg-muted">
                      <FileSearch className="size-6 text-muted-foreground" />
                    </div>
                    <p className="mt-4 text-sm font-medium text-muted-foreground">
                      No results yet
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground/70">
                      Upload a blueprint and click &quot;Start Takeoff&quot; to begin analysis.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}

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
      <div className="flex size-7 shrink-0 items-center justify-center rounded-full border-2 border-primary bg-primary/10">
        <Loader2 className="size-3.5 animate-spin text-primary" />
      </div>
    );
  }

  if (complete) {
    return (
      <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary">
        <CheckCircle2 className="size-4 text-primary-foreground" />
      </div>
    );
  }

  if (active) {
    return (
      <div className="flex size-7 shrink-0 items-center justify-center rounded-full border-2 border-primary bg-primary/10">
        <span className="text-xs font-bold text-primary">{step}</span>
      </div>
    );
  }

  return (
    <div className="flex size-7 shrink-0 items-center justify-center rounded-full border-2 border-muted-foreground/20">
      <span className="text-xs font-bold text-muted-foreground/40">{step}</span>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border bg-muted/30 p-3">
      <p className="text-2xl font-bold tabular-nums tracking-tight">
        {value.toLocaleString()}
      </p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
