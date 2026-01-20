"use client";

import { useState, useCallback, useRef } from "react";
import { upload } from "@vercel/blob/client";
import { Upload, File, X, Loader2 } from "lucide-react";

interface UploadZoneProps {
  onUploadComplete: (url: string, filename: string) => void;
  disabled?: boolean;
}

export function UploadZone({ onUploadComplete, disabled }: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<{
    name: string;
    url: string;
  } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const uploadFile = async (file: File) => {
    // Validate file type
    const allowedTypes = ["application/pdf", "image/png", "image/jpeg", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      setError("Invalid file type. Please upload a PDF or image.");
      return;
    }

    // Validate file size (50MB)
    if (file.size > 50 * 1024 * 1024) {
      setError("File too large. Maximum size is 50MB.");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setError(null);

    try {
      const blob = await upload(file.name, file, {
        access: "public",
        handleUploadUrl: "/api/upload",
        onUploadProgress: (progress) => {
          setUploadProgress(Math.round(progress.percentage));
        },
      });

      setUploadedFile({ name: file.name, url: blob.url });
      onUploadComplete(blob.url, file.name);
    } catch (err) {
      setError((err as Error).message || "Upload failed");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
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
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }, []);

  if (uploadedFile) {
    return (
      <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white border border-neutral-200">
              <File className="h-5 w-5 text-neutral-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-neutral-900">{uploadedFile.name}</p>
              <p className="text-xs text-neutral-500">Ready for analysis</p>
            </div>
          </div>
          <button
            onClick={clearFile}
            className="rounded-full p-1.5 text-neutral-400 hover:bg-neutral-200 hover:text-neutral-600 transition-colors"
            disabled={disabled}
          >
            <X className="h-4 w-4" />
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
      className={`relative rounded-lg border-2 border-dashed p-8 text-center transition-all ${
        isDragging
          ? "border-neutral-400 bg-neutral-100"
          : "border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50"
      } ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,image/png,image/jpeg,image/webp"
        onChange={handleFileSelect}
        disabled={disabled || isUploading}
        className="absolute inset-0 cursor-pointer opacity-0"
      />

      <div className="flex flex-col items-center gap-3">
        {isUploading ? (
          <>
            <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
            <div className="w-full max-w-[200px]">
              <div className="mb-1 flex justify-between text-xs text-neutral-500">
                <span>Uploading...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="h-1 w-full overflow-hidden rounded-full bg-neutral-200">
                <div
                  className="h-full bg-neutral-900 transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-neutral-200 bg-white">
              <Upload className="h-5 w-5 text-neutral-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-neutral-700">
                Drop blueprint here
              </p>
              <p className="mt-1 text-xs text-neutral-400">
                PDF, PNG, JPG up to 50MB
              </p>
            </div>
          </>
        )}

        {error && (
          <p className="mt-2 text-xs text-red-500">{error}</p>
        )}
      </div>
    </div>
  );
}
