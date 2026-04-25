"use client";

import { useState } from "react";
import { uploadFileToSupabaseStorage } from "@/lib/storage/upload-client";

type UploadImageResult = {
  url: string;
  userId: string | null;
};

export function useChatImageUpload(): {
  uploadImage: (file: File | null | undefined) => Promise<UploadImageResult | null>;
  isUploading: boolean;
  progress: number;
  reset: () => void;
} {
  const [progress, setProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const uploadImage = async (file: File | null | undefined): Promise<UploadImageResult | null> => {
    if (!file) {
      return null;
    }

    setIsUploading(true);
    setProgress(0);
    try {
      const url = await uploadFileToSupabaseStorage(file, "chatImage", {
        onProgress: setProgress,
      });
      return { url, userId: null };
    } finally {
      setIsUploading(false);
    }
  };

  const reset = (): void => {
    setProgress(0);
  };

  return { uploadImage, isUploading, progress, reset };
}
