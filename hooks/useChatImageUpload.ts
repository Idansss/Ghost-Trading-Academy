"use client";

import { useState } from "react";
import { useUploadThing } from "@/lib/uploadthing";

type UploadImageResult = {
  url: string;
  userId: string | null;
};

// AUDIT FIX: The original hook exposed no reset helper and returned only a raw
// URL, which made it impossible for the composer to clear upload state safely.
export function useChatImageUpload(): {
  uploadImage: (file: File | null | undefined) => Promise<UploadImageResult | null>;
  isUploading: boolean;
  progress: number;
  reset: () => void;
} {
  const [progress, setProgress] = useState(0);
  const { startUpload, isUploading } = useUploadThing("chatImage", {
    onUploadProgress: setProgress,
  });

  const uploadImage = async (file: File | null | undefined): Promise<UploadImageResult | null> => {
    if (!file) {
      return null;
    }

    const uploadedFiles = await startUpload([file]);
    const uploadedFile = uploadedFiles?.[0];

    if (!uploadedFile) {
      return null;
    }

    return {
      url: uploadedFile.serverData?.url ?? uploadedFile.url,
      userId: uploadedFile.serverData?.userId ?? null,
    };
  };

  const reset = (): void => {
    setProgress(0);
  };

  return { uploadImage, isUploading, progress, reset };
}
