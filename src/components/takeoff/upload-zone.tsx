"use client";

import { useState, useCallback, useRef } from "react";
import { upload } from "@vercel/blob/client";
import { Upload, FileText, X, Loader2, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

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
    const allowedTypes = ["application/pdf", "image/png", "image/jpeg", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      setError("Invalid file type. Please upload a PDF or image.");
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      setError("File too large. Maximum size is 50MB.");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setError(null);

    try {
      const ext = file.name.split(".").pop() || "pdf";
      const blobPath = `blueprints/${crypto.randomUUID()}.${ext}`;

      const blob = await upload(blobPath, file, {
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
    const isPdf = uploadedFile.name.toLowerCase().endsWith(".pdf");
    return (
      <div className="flex items-center gap-3 rounded-lg border bg-muted/30 p-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border bg-background">
          {isPdf ? (
            <FileText className="size-4 text-red-500" />
          ) : (
            <ImageIcon className="size-4 text-blue-500" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{uploadedFile.name}</p>
          <p className="text-xs text-muted-foreground">Ready for analysis</p>
        </div>
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={clearFile}
          disabled={disabled}
          className="shrink-0 text-muted-foreground hover:text-foreground"
        >
          <X className="size-3.5" />
        </Button>
      </div>
    );
  }

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`relative cursor-pointer rounded-lg border-2 border-dashed p-6 text-center transition-all ${
        isDragging
          ? "border-primary bg-primary/5"
          : "border-muted-foreground/20 hover:border-muted-foreground/40 hover:bg-muted/50"
      } ${disabled ? "pointer-events-none opacity-50" : ""}`}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,image/png,image/jpeg,image/webp"
        onChange={handleFileSelect}
        disabled={disabled || isUploading}
        className="absolute inset-0 cursor-pointer opacity-0"
      />

      <div className="flex flex-col items-center gap-2">
        {isUploading ? (
          <>
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
            <div className="w-full max-w-45 space-y-1.5">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Uploading...</span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="h-1.5" />
            </div>
          </>
        ) : (
          <>
            <div className="flex size-9 items-center justify-center rounded-full border bg-background">
              <Upload className="size-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium">Drop blueprint here</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                PDF, PNG, JPG up to 50MB
              </p>
            </div>
          </>
        )}

        {error && (
          <p className="mt-1 text-xs text-destructive">{error}</p>
        )}
      </div>
    </div>
  );
}
