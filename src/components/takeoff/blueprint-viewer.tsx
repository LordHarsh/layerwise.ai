"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { TakeoffItem } from "@/types";

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface BlueprintViewerProps {
  /** URL of the PDF file (Vercel Blob URL) */
  pdfUrl: string;
  /** All takeoff items (used for overlay) */
  items: TakeoffItem[];
  /** Currently selected item index (controlled) */
  selectedItemIndex: number | null;
  /** Callback when an item is selected via bbox click */
  onItemSelect: (index: number) => void;
}

export function BlueprintViewer({
  pdfUrl,
  items,
  selectedItemIndex,
  onItemSelect,
}: BlueprintViewerProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(600);

  // Measure container width for responsive rendering
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Auto-navigate to selected item's page
  useEffect(() => {
    if (selectedItemIndex === null) return;
    const item = items[selectedItemIndex];
    if (item && item.page_number !== currentPage) {
      setCurrentPage(item.page_number);
    }
  }, [selectedItemIndex, items, currentPage]);

  const onDocumentLoadSuccess = useCallback(
    ({ numPages: pages }: { numPages: number }) => {
      setNumPages(pages);
      setLoading(false);
    },
    []
  );

  const goToPrev = useCallback(() => {
    setCurrentPage((p) => Math.max(1, p - 1));
  }, []);

  const goToNext = useCallback(() => {
    setCurrentPage((p) => Math.min(numPages, p + 1));
  }, [numPages]);

  // Items on the current page that have bounding boxes
  const pageItems = items
    .map((item, idx) => ({ item, idx }))
    .filter(({ item }) => item.page_number === currentPage && item.bbox);

  return (
    <div ref={containerRef} className="relative">
      {/* Navigation */}
      {numPages > 1 && (
        <div className="flex items-center justify-between border-b border-[#e2d5c3] px-4 py-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={goToPrev}
            disabled={currentPage <= 1}
            className="h-7 px-2"
          >
            <ChevronLeft className="size-4" />
            Prev
          </Button>
          <span className="text-xs tabular-nums text-[#78716c]">
            Page {currentPage} of {numPages}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={goToNext}
            disabled={currentPage >= numPages}
            className="h-7 px-2"
          >
            Next
            <ChevronRight className="size-4" />
          </Button>
        </div>
      )}

      {/* PDF + Overlay */}
      <div className="relative">
        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="size-6 animate-spin text-[#78716c]" />
          </div>
        )}

        <Document
          file={pdfUrl}
          onLoadSuccess={onDocumentLoadSuccess}
          loading={null}
          className="flex justify-center"
        >
          <div className="relative inline-block">
            <Page
              pageNumber={currentPage}
              width={containerWidth - 2}
              loading={null}
            />

            {/* SVG overlay for bounding boxes */}
            {pageItems.length > 0 && (
              <svg
                viewBox="0 0 1000 1000"
                className="pointer-events-none absolute inset-0 size-full"
                preserveAspectRatio="none"
              >
                {pageItems.map(({ item, idx }) => {
                  const [yMin, xMin, yMax, xMax] = item.bbox!;
                  const isSelected = selectedItemIndex === idx;

                  return (
                    <rect
                      key={idx}
                      x={xMin}
                      y={yMin}
                      width={xMax - xMin}
                      height={yMax - yMin}
                      fill={isSelected ? "rgba(194, 65, 12, 0.15)" : "rgba(194, 65, 12, 0.08)"}
                      stroke={isSelected ? "#c2410c" : "#c2410c80"}
                      strokeWidth={isSelected ? 3 : 1.5}
                      rx={4}
                      className="pointer-events-auto cursor-pointer transition-all hover:fill-[rgba(194,65,12,0.2)] hover:stroke-[#c2410c]"
                      onClick={() => onItemSelect(idx)}
                    />
                  );
                })}
              </svg>
            )}
          </div>
        </Document>
      </div>

      {/* Approximate label */}
      {pageItems.length > 0 && (
        <p className="border-t border-[#e2d5c3] px-4 py-1.5 text-center text-[10px] text-[#a8a29e]">
          Bounding boxes are approximate. Click a box to select the item.
        </p>
      )}
    </div>
  );
}
