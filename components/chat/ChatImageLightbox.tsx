"use client";

import { Download, X } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";

type ChatImageLightboxProps = {
  imageUrl: string | null;
  imageName: string | null;
  open: boolean;
  onClose: () => void;
};

export function ChatImageLightbox({
  imageUrl,
  imageName,
  open,
  onClose,
}: ChatImageLightboxProps) {
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    // AUDIT FIX: Opening the lightbox now locks background scrolling so mobile
    // users do not accidentally scroll the chat underneath the dialog.
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }

      if (event.key === "Tab") {
        event.preventDefault();
        closeButtonRef.current?.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  if (!open || !imageUrl || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Image viewer"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4"
      onClick={onClose}
    >
      <div
        className="relative max-h-[90vh] max-w-[90vw]"
        onClick={(event) => event.stopPropagation()}
      >
        <Image
          src={imageUrl}
          alt={imageName ?? "Chat image"}
          width={1200}
          height={900}
          sizes="90vw"
          className="max-h-[85vh] w-auto rounded-lg object-contain"
        />
        <div className="absolute right-2 top-2 flex gap-2">
          {/* AUDIT FIX: Download now uses a direct download anchor instead of
              relying on target=_blank, which did not reliably download files. */}
          <a href={imageUrl} download={imageName ?? "chat-image"} aria-label="Download image">
            <Button type="button" size="icon" variant="secondary">
              <Download className="h-4 w-4" />
            </Button>
          </a>
          <Button
            ref={closeButtonRef}
            type="button"
            size="icon"
            variant="secondary"
            onClick={onClose}
            aria-label="Close image viewer"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
