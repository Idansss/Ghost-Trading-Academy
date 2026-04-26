"use client";

import { Paperclip, Send, Smile, X } from "lucide-react";
// CLAUDE FIX: removed next/image import — the composer preview uses a local blob: URL
// which next/image rejects (hostname "localhost" not in remotePatterns). Use <img> instead.
import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { useChatImageUpload } from "@/hooks/useChatImageUpload";
import type { ChatMessageWithAuthor, ChatReplyPreview } from "@/types/chat";

// CLAUDE FIX: Lazy-load the emoji picker so it doesn't bloat the initial chat bundle.
const EmojiPickerWrapper = dynamic(() => import("./EmojiPickerWrapper"), {
  ssr: false,
  loading: () => (
    <div className="h-96 w-80 flex items-center justify-center text-sm text-muted-foreground">
      Loading emojis…
    </div>
  ),
});

type AttachedImage = {
  localUrl: string;
  remoteUrl: string | null;
  width: number;
  height: number;
  name: string;
};

// CLAUDE FIX: Added 3 s timeout so the handler can never hang indefinitely when
// certain animated/WebP images fail to fire onload or onerror in some browsers.
async function readImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new window.Image();

    const timeout = window.setTimeout(() => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Image dimension read timed out."));
    }, 3000);

    image.onload = () => {
      clearTimeout(timeout);
      resolve({ width: image.width, height: image.height });
      URL.revokeObjectURL(objectUrl);
    };
    image.onerror = () => {
      clearTimeout(timeout);
      reject(new Error("Unable to read image dimensions."));
      URL.revokeObjectURL(objectUrl);
    };
    image.src = objectUrl;
  });
}

export function MessageComposer({
  channelName,
  isReadOnly,
  canPost,
  replyTo,
  editingMessage,
  onCancelReply,
  onCancelEdit,
  onSubmit,
  onTyping,
}: {
  channelName: string;
  isReadOnly: boolean;
  canPost: boolean;
  replyTo: ChatMessageWithAuthor | null;
  editingMessage: ChatMessageWithAuthor | null;
  onCancelReply: () => void;
  onCancelEdit: () => void;
  onSubmit: (payload: {
    body?: string;
    image?: { url: string; width: number; height: number; name: string };
    replyToId?: string | null;
    replyTo?: ChatReplyPreview | null;
    editMessageId?: string;
  }) => Promise<void>;
  onTyping: (isTyping: boolean) => void;
}) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  // CLAUDE FIX: Track localUrl in a ref so clearImage() always revokes the
  // correct blob URL even when called from an async closure that captures stale
  // component state (the closure captures the image value from the render it
  // was created in, which may be null by the time clearImage runs).
  const localUrlRef = useRef<string | null>(null);
  const [body, setBody] = useState(editingMessage?.body ?? "");
  const [image, setImage] = useState<AttachedImage | null>(null);
  const [isCoolingDown, setIsCoolingDown] = useState(false);
  const { uploadImage, isUploading, reset } = useChatImageUpload();

  useEffect(() => {
    setBody(editingMessage?.body ?? "");
    textareaRef.current?.focus();
  }, [editingMessage]);

  useEffect(() => {
    const element = textareaRef.current;
    if (!element) {
      return;
    }

    // AUDIT FIX: The composer now auto-grows up to five lines instead of
    // keeping a fixed height that clipped multiline messages.
    element.style.height = "0px";
    element.style.height = `${Math.min(element.scrollHeight, 24 * 5 + 24)}px`;
  }, [body]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      onTyping(Boolean(body.trim()));
    }, 500);

    return () => window.clearTimeout(timeout);
  }, [body, onTyping]);

  const clearImage = (): void => {
    // CLAUDE FIX: Revoke via ref, not stale closure state, to avoid blob URL leaks.
    if (localUrlRef.current) {
      URL.revokeObjectURL(localUrlRef.current);
      localUrlRef.current = null;
    }
    setImage(null);
    reset();
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // CLAUDE FIX: cursor-position-aware emoji insertion — inserts at caret rather
  // than always appending to the end.
  const insertEmoji = (emoji: { native: string }): void => {
    const textarea = textareaRef.current;
    if (!textarea) {
      setBody((prev) => prev + emoji.native);
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newBody = body.slice(0, start) + emoji.native + body.slice(end);
    setBody(newBody);

    // Restore cursor position after the inserted emoji.
    window.setTimeout(() => {
      textarea.focus();
      const newPos = start + emoji.native.length;
      textarea.setSelectionRange(newPos, newPos);
    }, 0);
  };

  const canSend = Boolean(body.trim() || image?.remoteUrl) && !isUploading && !isCoolingDown;

  const submitOutgoingMessage = async (): Promise<void> => {
    const trimmedBody = body.trim();
    const pendingImage = image;
    const pendingReplyTo = replyTo;
    const pendingEditingMessage = editingMessage;

    const payload = {
      body: trimmedBody || undefined,
      image:
        pendingImage?.remoteUrl && !pendingEditingMessage
          ? {
              url: pendingImage.remoteUrl,
              width: pendingImage.width,
              height: pendingImage.height,
              name: pendingImage.name,
            }
          : undefined,
      replyToId: pendingReplyTo?.id ?? null,
      replyTo: pendingReplyTo
        ? {
            id: pendingReplyTo.id,
            body: pendingReplyTo.body,
            imageUrl: pendingReplyTo.imageUrl,
            hasImage: Boolean(pendingReplyTo.imageUrl),
            author: { name: pendingReplyTo.author.name },
          }
        : null,
      editMessageId: pendingEditingMessage?.id,
    };

    // Clear text immediately for faster perceived send.
    if (!pendingEditingMessage) {
      setBody("");
      onTyping(false);
      textareaRef.current?.focus();
    }

    setIsCoolingDown(true);
    try {
      await onSubmit(payload);
      if (pendingEditingMessage) {
        setBody("");
        onCancelEdit();
        onTyping(false);
        textareaRef.current?.focus();
      } else {
        clearImage();
        onCancelReply();
      }
    } catch {
      // If send fails, restore the draft so the user can retry quickly.
      if (!pendingEditingMessage) {
        setBody(trimmedBody);
      }
    } finally {
      // If onSubmit throws (e.g. network error), still clear cooldown — otherwise
      // isCoolingDown stays true forever and the send button stays disabled.
      window.setTimeout(() => setIsCoolingDown(false), 500);
    }
  };

  if (isReadOnly && !canPost) {
    return (
      <div className="border-t border-border p-4 text-sm text-muted-foreground">
        This channel is read-only. Only admins can post here.
      </div>
    );
  }

  return (
    <div className="space-y-2 border-t border-border bg-background/80 p-3">
      {replyTo ? (
        <div className="flex items-center justify-between rounded-lg bg-muted/60 px-3 py-2 text-xs">
          <span className="truncate">
            Replying to {replyTo.author.name}: {replyTo.body ?? (replyTo.imageUrl ? "[Image]" : "")}
          </span>
          <Button type="button" size="icon" variant="ghost" onClick={onCancelReply} aria-label="Cancel reply">
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : null}

      {editingMessage ? (
        <div className="flex items-center justify-between rounded-lg bg-muted/60 px-3 py-2 text-xs">
          <span>Editing message</span>
          <Button type="button" size="sm" variant="ghost" onClick={onCancelEdit}>
            Cancel
          </Button>
        </div>
      ) : null}

      {image ? (
        <div className="flex items-center gap-2 rounded-lg border border-border p-2">
          {/* CLAUDE FIX: plain <img> for the local blob preview — no domain validation */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={image.localUrl}
            alt={image.name}
            className="h-16 w-16 max-w-[96px] rounded-md object-cover"
          />
          <div className="min-w-0 flex-1 text-xs text-muted-foreground">
            <p className="truncate">{image.name}</p>
            <p>{isUploading ? "Uploading image..." : "Ready to send"}</p>
          </div>
          <Button type="button" size="icon" variant="ghost" onClick={clearImage} aria-label="Remove attached image">
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : null}

      <div className="flex items-end gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          aria-label="Upload chat image"
          onChange={async (event) => {
            // CLAUDE FIX: Outer try/catch ensures any unhandled exception inside this
            // async handler (before setImage is reached) surfaces as a toast instead of
            // silently dying as an unhandled Promise rejection with no user feedback.
            try {
              const file = event.target.files?.[0];
              if (!file) {
                return;
              }

              // Do not call clearImage() here — it resets the file input and can break
              // the picker on some browsers. Only drop the previous preview / upload state.
              if (localUrlRef.current) {
                URL.revokeObjectURL(localUrlRef.current);
                localUrlRef.current = null;
              }
              setImage(null);
              reset();

              // CLAUDE FIX: readImageDimensions was outside the try/catch, so any failure
              // (e.g. CSP blocking blob: URLs, unsupported format) silently killed the entire
              // handler with no preview, no upload, and no error toast. Fall back to 0×0 so
              // the upload still proceeds and the server stores actual dimensions.
              let dimensions = { width: 0, height: 0 };
              try {
                dimensions = await readImageDimensions(file);
              } catch {
                // non-fatal — upload still proceeds with unknown dimensions
              }

              const localUrl = URL.createObjectURL(file);
              localUrlRef.current = localUrl;
              setImage({
                localUrl,
                remoteUrl: null,
                width: dimensions.width,
                height: dimensions.height,
                name: file.name,
              });

              try {
                const uploadedImage = await uploadImage(file);
                if (uploadedImage?.url) {
                  setImage((currentImage) =>
                    currentImage
                      ? {
                          ...currentImage,
                          remoteUrl: uploadedImage.url,
                        }
                      : currentImage,
                  );
                } else {
                  clearImage();
                  toast.error("Image upload failed. Please try again.");
                }
              } catch (err) {
                clearImage();
                const message = err instanceof Error ? err.message : "Image upload failed.";
                toast.error(message);
              } finally {
                event.target.value = "";
              }
            } catch (err) {
              const message = err instanceof Error ? err.message : "Could not attach image.";
              toast.error(message);
            }
          }}
        />

        <Button
          type="button"
          size="icon"
          variant="outline"
          aria-label="Attach image"
          disabled={Boolean(editingMessage) || isUploading}
          onClick={() => fileInputRef.current?.click()}
        >
          <Paperclip className="h-4 w-4" />
        </Button>

        {/* CLAUDE FIX: Emoji picker — opens as a popover above the composer. */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              type="button"
              size="icon"
              variant="outline"
              aria-label="Insert emoji"
            >
              <Smile className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 border-none shadow-lg" side="top" align="start">
            <EmojiPickerWrapper onEmojiSelect={insertEmoji} />
          </PopoverContent>
        </Popover>

        <Textarea
          ref={textareaRef}
          aria-label={`Message #${channelName}`}
          value={body}
          onBlur={() => onTyping(false)}
          onChange={(event) => {
            const nextValue = event.target.value;
            setBody(nextValue);
            if (!nextValue.trim()) {
              onTyping(false);
            }
          }}
          onKeyDown={async (event) => {
            if (event.key === "Escape" && editingMessage) {
              event.preventDefault();
              onCancelEdit();
              return;
            }

            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              if (!canSend) {
                return;
              }

              await submitOutgoingMessage();
            }
          }}
          rows={1}
          className="min-h-[44px] max-h-[140px] resize-none overflow-y-auto scrollbar-none"
          placeholder={`Message #${channelName}`}
        />

        <Button
          type="button"
          aria-label={editingMessage ? "Save message" : "Send message"}
          disabled={!canSend}
          onClick={async () => {
            if (!canSend) {
              return;
            }

            await submitOutgoingMessage();
          }}
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
