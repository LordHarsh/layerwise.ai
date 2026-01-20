"use client";

import { useState, useCallback } from "react";
import { Upload, File, X, Loader2 } from "lucide-react";

interface UploadZoneProps {
  onUploadComplete: (url: string, filename: string) => void;
  disabled?: boolean;
}

export function UploadZone({ onUploadComplete, disabled }: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<{
    name: string;
    url: string;
  } | null>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const uploadFile = async (file: File) => {
    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Upload failed");
      }

      const data = await response.json();
      setUploadedFile({ name: file.name, url: data.url });
      onUploadComplete(data.url, file.name);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      if (disabled || isUploading) return;

      const file = e.dataTransfer.files[0];
      if (file) {
        uploadFile(file);
      }
    },
    [disabled, isUploading]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (disabled || isUploading) return;

      const file = e.target.files?.[0];
      if (file) {
        uploadFile(file);
      }
    },
    [disabled, isUploading]
  );

  const clearFile = useCallback(() => {
    setUploadedFile(null);
    setError(null);
  }, []);

  if (uploadedFile) {
    return (
      <div className="rounded-lg border-2 border-green-200 bg-green-50 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
              <File className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="font-medium text-green-900">{uploadedFile.name}</p>
              <p className="text-sm text-green-600">Ready for analysis</p>
            </div>
          </div>
          <button
            onClick={clearFile}
            className="rounded-full p-1 hover:bg-green-200"
            disabled={disabled}
          >
            <X className="h-5 w-5 text-green-600" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`relative rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
        isDragging
          ? "border-blue-500 bg-blue-50"
          : "border-neutral-300 hover:border-neutral-400"
      } ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
    >
      <input
        type="file"
        accept=".pdf,image/png,image/jpeg,image/webp"
        onChange={handleFileSelect}
        disabled={disabled || isUploading}
        className="absolute inset-0 cursor-pointer opacity-0"
      />

      <div className="flex flex-col items-center gap-3">
        {isUploading ? (
          <>
            <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
            <p className="text-sm font-medium text-neutral-700">Uploading...</p>
          </>
        ) : (
          <>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
              <Upload className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="font-medium text-neutral-900">
                Drop your blueprint here
              </p>
              <p className="text-sm text-neutral-500">
                or click to browse (PDF, PNG, JPG up to 50MB)
              </p>
            </div>
          </>
        )}

        {error && (
          <p className="mt-2 text-sm text-red-600">{error}</p>
        )}
      </div>
    </div>
  );
}
