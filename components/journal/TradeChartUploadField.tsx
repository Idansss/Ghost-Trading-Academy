"use client";

import { ImagePlus, Loader2, X } from "lucide-react";
import Image from "next/image";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { getUploadThingFileUrl, useUploadThing } from "@/lib/uploadthing";

export function TradeChartUploadField({
  imageUrl,
  onUpload,
  onRemove,
}: {
  imageUrl?: string | null;
  onUpload: (url: string) => void;
  onRemove: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState(0);
  const { startUpload, isUploading } = useUploadThing("tradeChart", {
    onUploadProgress: setProgress,
  });

  const handleFiles = async (files: FileList | File[]) => {
    const file = Array.from(files)[0];
    if (!file) {
      return;
    }

    try {
      const response = await startUpload([file]);
      const uploaded = response?.[0];
      const url = getUploadThingFileUrl(uploaded);

      if (!url) {
        throw new Error("Upload did not complete.");
      }

      onUpload(url);
      toast.success("Chart image uploaded. Save the trade to attach it.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to upload chart image.",
      );
    }
  };

  return (
    <div className="space-y-3">
      {imageUrl ? (
        <div className="relative overflow-hidden rounded-3xl border border-border bg-muted/20">
          <div className="relative h-56 w-full">
            <Image
              src={imageUrl}
              alt="Trade chart upload preview"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>
          <div className="absolute right-3 top-3 flex gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => inputRef.current?.click()}
              disabled={isUploading}
            >
              {isUploading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <ImagePlus className="mr-2 h-4 w-4" />
              )}
              Replace
            </Button>
            <Button
              type="button"
              size="icon"
              variant="outline"
              onClick={onRemove}
              aria-label="Remove chart image"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={isUploading}
          className="flex w-full flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-border bg-muted/20 px-6 py-10 text-center transition hover:border-primary/30 hover:bg-primary/5"
        >
          {isUploading ? (
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          ) : (
            <ImagePlus className="h-6 w-6 text-primary" />
          )}
          <div className="space-y-1">
            <p className="text-sm font-medium">Upload chart image</p>
            <p className="text-xs text-muted-foreground">
              Add a screenshot from your chart. Mobile file pickers can use your camera roll directly.
            </p>
            {isUploading ? (
              <p className="text-xs text-primary">Uploading {progress}%...</p>
            ) : null}
          </div>
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/*"
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
