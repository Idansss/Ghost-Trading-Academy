"use client";

import { format } from "date-fns";
import { Copy, Ellipsis, Pencil, Pin, Reply, Trash2 } from "lucide-react";
import Image from "next/image";
import { useMemo, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { CHAT_ALLOWED_EMOJIS, type ChatMessageWithAuthor } from "@/types/chat";

type ChatMessageProps = {
  message: ChatMessageWithAuthor;
  grouped: boolean;
  highlighted: boolean;
  canModerate: boolean;
  canEdit: boolean;
  reactorNamesById: Record<string, string>;
  onReply: (message: ChatMessageWithAuthor) => void;
  onEdit: (message: ChatMessageWithAuthor) => void;
  onDelete: (messageId: string) => void;
  onPin: (messageId: string) => void;
  onReact: (messageId: string, emoji: string) => void;
  onOpenImage: (image: { url: string; name: string | null }) => void;
  onJumpToMessage: (messageId: string) => void;
};

export function ChatMessage({
  message,
  grouped,
  highlighted,
  canModerate,
  canEdit,
  reactorNamesById,
  onReply,
  onEdit,
  onDelete,
  onPin,
  onReact,
  onOpenImage,
  onJumpToMessage,
}: ChatMessageProps) {
  const [showMobileActions, setShowMobileActions] = useState(false);
  const canDelete = canEdit || canModerate;
  const displayName = message.author.name || "Member";
  const initials = displayName
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  const reactionTooltipLabels = useMemo(
    () =>
      Object.fromEntries(
        message.reactions.map((reaction) => [
          reaction.emoji,
          reaction.userIds.map((userId) => reactorNamesById[userId] ?? "Member").join(", "),
        ]),
      ),
    [message.reactions, reactorNamesById],
  );

  const renderActionBar = (isMobile = false) => {
    if (message.isDeleted) {
      return null;
    }

    return (
      <div
        className={`flex flex-wrap items-center gap-1 rounded-2xl border border-border bg-background/95 p-1 shadow-sm ${
          isMobile ? "mt-2" : "absolute right-2 top-2 hidden md:flex md:opacity-0 md:transition md:group-hover:opacity-100"
        }`}
      >
        {CHAT_ALLOWED_EMOJIS.map((emoji) => (
          <button
            key={emoji}
            type="button"
            aria-label={`React ${emoji}`}
            className="rounded px-1.5 py-1 text-sm hover:bg-muted"
            onClick={() => onReact(message.id, emoji)}
          >
            {emoji}
          </button>
        ))}
        <Button type="button" size="icon" variant="ghost" aria-label="Reply to message" onClick={() => onReply(message)}>
          <Reply className="h-4 w-4" />
        </Button>
        {canEdit ? (
          <Button type="button" size="icon" variant="ghost" aria-label="Edit message" onClick={() => onEdit(message)}>
            <Pencil className="h-4 w-4" />
          </Button>
        ) : null}
        {canDelete ? (
          <Button type="button" size="icon" variant="ghost" aria-label="Delete message" onClick={() => onDelete(message.id)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        ) : null}
        {canModerate ? (
          <Button type="button" size="icon" variant="ghost" aria-label="Pin message" onClick={() => onPin(message.id)}>
            <Pin className="h-4 w-4" />
          </Button>
        ) : null}
        <Button
          type="button"
          size="icon"
          variant="ghost"
          aria-label="Copy message text"
          onClick={async () => {
            await navigator.clipboard.writeText(message.body ?? "");
          }}
        >
          <Copy className="h-4 w-4" />
        </Button>
      </div>
    );
  };

  return (
    <div
      id={`message-${message.id}`}
      className={`group relative rounded-2xl px-3 py-2 transition ${
        grouped ? "ml-11" : ""
      } ${message.isPending ? "opacity-70" : ""} ${highlighted ? "bg-yellow-200/40" : "hover:bg-muted/40"}`}
    >
      <div className="flex gap-3">
        {!grouped ? (
          <Avatar className="h-8 w-8">
            <AvatarImage src={message.author.image ?? undefined} alt={displayName} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        ) : (
          <div className="w-8" />
        )}

        <div className="min-w-0 flex-1 space-y-1.5">
          {!grouped ? (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="text-sm font-semibold text-foreground">{displayName}</span>
              <span>{format(new Date(message.createdAt), "p")}</span>
            </div>
          ) : null}

          {message.replyTo ? (
            <button
              type="button"
              onClick={() => onJumpToMessage(message.replyTo!.id)}
              className="w-full rounded-md border-l-2 border-l-[var(--color-gold)] bg-muted/60 px-2 py-1 text-left text-xs"
            >
              <p className="font-medium">{message.replyTo.author.name}</p>
              <p className="truncate text-muted-foreground">
                {message.replyTo.body ?? (message.replyTo.hasImage ? "[Image]" : "")}
              </p>
            </button>
          ) : null}

          {message.isDeleted ? (
            <p className="italic text-muted-foreground">This message was deleted</p>
          ) : (
            <>
              {message.body ? (
                <p className="whitespace-pre-wrap break-words text-sm">
                  {message.body}{" "}
                  {message.isEdited ? <span className="text-xs text-muted-foreground">(edited)</span> : null}
                </p>
              ) : null}
              {message.imageUrl ? (
                <button
                  type="button"
                  aria-label="Open image in lightbox"
                  onClick={() => onOpenImage({ url: message.imageUrl!, name: message.imageName })}
                >
                  <Image
                    src={message.imageUrl}
                    alt={message.imageName ?? "Chat image"}
                    width={message.imageWidth ?? 320}
                    height={message.imageHeight ?? 240}
                    sizes="(max-width: 768px) 70vw, 320px"
                    className="max-w-[320px] rounded-xl border border-border object-cover"
                  />
                </button>
              ) : null}
            </>
          )}

          {message.reactions.length > 0 ? (
            <div className="flex flex-wrap gap-1 pt-1">
              {message.reactions.map((reaction) => (
                <button
                  key={reaction.emoji}
                  type="button"
                  aria-label={`React with ${reaction.emoji}`}
                  className={`rounded-full border px-2 py-0.5 text-xs ${
                    reaction.hasReacted
                      ? "border-yellow-500 bg-yellow-100 text-yellow-900"
                      : "border-border bg-background"
                  }`}
                  onClick={() => onReact(message.id, reaction.emoji)}
                  title={reactionTooltipLabels[reaction.emoji]}
                >
                  {reaction.emoji} {reaction.count}
                </button>
              ))}
            </div>
          ) : null}

          <div className="md:hidden">
            {!message.isDeleted ? (
              <Button
                type="button"
                size="icon"
                variant="ghost"
                aria-label="Open message actions"
                onClick={() => setShowMobileActions((currentValue) => !currentValue)}
              >
                <Ellipsis className="h-4 w-4" />
              </Button>
            ) : null}
            {showMobileActions ? renderActionBar(true) : null}
          </div>
        </div>
      </div>

      {renderActionBar(false)}
    </div>
  );
}
