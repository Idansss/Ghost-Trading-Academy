"use client";

import { Camera, Loader2 } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useUploadThing } from "@/lib/uploadthing";

export function AvatarUploadButton({
  name,
  initials,
  imageUrl,
  onUpload,
}: {
  name?: string | null;
  initials: string;
  imageUrl?: string | null;
  onUpload: (url: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState(0);
  const { startUpload, isUploading } = useUploadThing("avatarUploader", {
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

      if (!uploaded?.serverData.url) {
        throw new Error("Upload did not complete.");
      }

      onUpload(uploaded.serverData.url);
      toast.success("Avatar uploaded. Save changes to apply it to your profile.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to upload avatar.",
      );
    }
  };

  return (
    <div className="flex items-center gap-4">
      <div className="relative">
        <Avatar className="h-20 w-20 border border-border">
          <AvatarImage src={imageUrl ?? undefined} alt={name ?? "Profile avatar"} />
          <AvatarFallback className="text-xl">{initials}</AvatarFallback>
        </Avatar>
        <Button
          type="button"
          size="icon"
          className="absolute -bottom-1 -right-1 h-9 w-9 rounded-full shadow-lg"
          onClick={() => inputRef.current?.click()}
          disabled={isUploading}
          aria-label="Upload profile picture"
        >
          {isUploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Camera className="h-4 w-4" />
          )}
        </Button>
      </div>

      <div className="space-y-1">
        <p className="font-medium">{name}</p>
        <button
          type="button"
          className="text-sm text-primary transition hover:underline"
          onClick={() => inputRef.current?.click()}
          disabled={isUploading}
        >
          {isUploading ? `Uploading ${progress}%...` : "Upload photo"}
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
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
