"use client";

import { Paperclip, Send, X } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useChatImageUpload } from "@/hooks/useChatImageUpload";
import type { ChatMessageWithAuthor, ChatReplyPreview } from "@/types/chat";

type AttachedImage = {
  localUrl: string;
  remoteUrl: string | null;
  width: number;
  height: number;
  name: string;
};

async function readImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new window.Image();
    image.onload = () => {
      resolve({ width: image.width, height: image.height });
      URL.revokeObjectURL(objectUrl);
    };
    image.onerror = () => {
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
    if (image?.localUrl) {
      URL.revokeObjectURL(image.localUrl);
    }
    setImage(null);
    reset();
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const canSend = Boolean(body.trim() || image?.remoteUrl) && !isUploading && !isCoolingDown;

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
          <Image
            src={image.localUrl}
            alt={image.name}
            width={64}
            height={64}
            className="max-w-[96px] rounded-md object-cover"
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
            const file = event.target.files?.[0];
            if (!file) {
              return;
            }

            clearImage();
            const dimensions = await readImageDimensions(file);
            const localUrl = URL.createObjectURL(file);
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
              }
            } catch {
              clearImage();
            } finally {
              event.target.value = "";
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

              setIsCoolingDown(true);
              await onSubmit({
                body: body.trim() || undefined,
                image:
                  image?.remoteUrl && !editingMessage
                    ? {
                        url: image.remoteUrl,
                        width: image.width,
                        height: image.height,
                        name: image.name,
                      }
                    : undefined,
                replyToId: replyTo?.id ?? null,
                replyTo: replyTo
                  ? {
                      id: replyTo.id,
                      body: replyTo.body,
                      imageUrl: replyTo.imageUrl,
                      hasImage: Boolean(replyTo.imageUrl),
                      author: { name: replyTo.author.name },
                    }
                  : null,
                editMessageId: editingMessage?.id,
              });
              setBody("");
              clearImage();
              onCancelReply();
              onCancelEdit();
              onTyping(false);
              textareaRef.current?.focus();
              window.setTimeout(() => setIsCoolingDown(false), 500);
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

            setIsCoolingDown(true);
            await onSubmit({
              body: body.trim() || undefined,
              image:
                image?.remoteUrl && !editingMessage
                  ? {
                      url: image.remoteUrl,
                      width: image.width,
                      height: image.height,
                      name: image.name,
                    }
                  : undefined,
              replyToId: replyTo?.id ?? null,
              replyTo: replyTo
                ? {
                    id: replyTo.id,
                    body: replyTo.body,
                    imageUrl: replyTo.imageUrl,
                    hasImage: Boolean(replyTo.imageUrl),
                    author: { name: replyTo.author.name },
                  }
                : null,
              editMessageId: editingMessage?.id,
            });
            setBody("");
            clearImage();
            onCancelReply();
            onCancelEdit();
            onTyping(false);
            textareaRef.current?.focus();
            window.setTimeout(() => setIsCoolingDown(false), 500);
          }}
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
