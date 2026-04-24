"use client";

import { CheckCircle2, CloudUpload, RefreshCcw, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { getUploadThingFilePayload, useUploadThing } from "@/lib/uploadthing";

type UploadedFile = {
  url: string;
  key: string;
  name: string;
};

export function PdfUploadButton({
  value,
  onUpload,
  onClear,
}: {
  value?: UploadedFile | null;
  onUpload: (url: string, key: string, name: string) => void;
  onClear?: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(
    value ?? null,
  );

  useEffect(() => {
    setUploadedFile(value ?? null);
  }, [value]);

  const { startUpload, isUploading } = useUploadThing("pdfUploader", {
    onUploadProgress: setProgress,
  });

  const handleFiles = async (files: FileList | File[]) => {
    const file = Array.from(files)[0];

    if (!file) {
      return;
    }

    setError(null);
    setProgress(0);

    try {
      const response = await startUpload([file]);
      const uploaded = response?.[0];
      const nextFile = getUploadThingFilePayload(uploaded);

      if (!nextFile) {
        throw new Error("Upload did not complete.");
      }

      setUploadedFile(nextFile);
      onUpload(nextFile.url, nextFile.key, nextFile.name);
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "Failed to upload PDF.",
      );
    }
  };

  return (
    <div className="space-y-3">
      {uploadedFile ? (
        <div className="rounded-2xl border border-[color:var(--color-green)]/30 bg-[color:var(--color-green-light)] p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 text-[color:var(--color-green)]" />
              <div>
                <p className="text-sm font-medium text-[color:var(--color-green)]">
                  {uploadedFile.name}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Upload complete
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => inputRef.current?.click()}
              >
                <RefreshCcw className="mr-2 h-4 w-4" />
                Replace
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => {
                  setUploadedFile(null);
                  setError(null);
                  setProgress(0);
                  onClear?.();
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(event) => {
            event.preventDefault();
          }}
          onDrop={(event) => {
            event.preventDefault();
            void handleFiles(event.dataTransfer.files);
          }}
          className="flex w-full flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-background/60 px-6 py-8 text-center transition-colors hover:border-[color:var(--color-gold)] hover:bg-[color:var(--bg-elevated)]"
        >
          <CloudUpload className="h-8 w-8 text-primary" />
          <p className="mt-3 text-sm font-medium">
            Click to upload PDF or drag and drop
          </p>
          <p className="mt-1 text-xs text-muted-foreground">PDF up to 16MB</p>
        </button>
      )}

      {isUploading ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Uploading...</span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} />
        </div>
      ) : null}

      {error ? (
        <div className="rounded-xl border border-[color:var(--color-red)]/30 bg-[color:var(--color-red-light)] p-3 text-sm text-[color:var(--color-red)]">
          <div className="flex items-center justify-between gap-3">
            <span>{error}</span>
            <button
              type="button"
              className="font-medium underline"
              onClick={() => inputRef.current?.click()}
            >
              Retry
            </button>
          </div>
        </div>
      ) : null}

      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={(event) => {
          if (event.target.files) {
            void handleFiles(event.target.files);
          }
          event.target.value = "";
        }}
      />
    </div>
  );
}
