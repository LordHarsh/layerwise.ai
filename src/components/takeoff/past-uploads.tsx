"use client";

import { useState, useEffect } from "react";
import { FileText, ImageIcon, Loader2, FolderOpen } from "lucide-react";

interface BlobFile {
  url: string;
  filename: string;
  size: number;
  uploadedAt: string;
}

interface PastUploadsProps {
  onSelect: (url: string, filename: string) => void;
  disabled?: boolean;
  currentUrl?: string | null;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function PastUploads({ onSelect, disabled, currentUrl }: PastUploadsProps) {
  const [files, setFiles] = useState<BlobFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchFiles() {
      try {
        const res = await fetch("/api/blobs");
        if (!res.ok) throw new Error("Failed to load files");
        const data = await res.json();
        if (!cancelled) setFiles(data.files || []);
      } catch (err) {
        if (!cancelled) setError((err as Error).message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchFiles();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="size-4 animate-spin text-[#a8a29e]" />
      </div>
    );
  }

  if (error || files.length === 0) {
    return null;
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5">
        <FolderOpen className="size-3.5 text-[#a8a29e]" />
        <p className="text-xs font-medium text-[#78716c]">Previous uploads</p>
      </div>
      <div className="max-h-48 space-y-1 overflow-y-auto">
        {files.map((file) => {
          const isPdf = file.filename.toLowerCase().endsWith(".pdf");
          const isSelected = currentUrl === file.url;
          return (
            <button
              key={file.url}
              onClick={() => onSelect(file.url, file.filename)}
              disabled={disabled}
              className={`flex w-full items-center gap-2.5 rounded-lg border px-3 py-2 text-left transition-colors ${
                isSelected
                  ? "border-[#c2410c] bg-[rgba(194,65,12,0.06)]"
                  : "border-[#e2d5c3] hover:bg-[#faf7f2]"
              } ${disabled ? "pointer-events-none opacity-50" : ""}`}
            >
              <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-[rgba(194,65,12,0.08)]">
                {isPdf ? (
                  <FileText className="size-3.5 text-[#c2410c]" />
                ) : (
                  <ImageIcon className="size-3.5 text-[#c2410c]" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium text-[#292018]">
                  {file.filename}
                </p>
                <p className="text-[10px] text-[#a8a29e]">
                  {new Date(file.uploadedAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}{" "}
                  · {formatFileSize(file.size)}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
