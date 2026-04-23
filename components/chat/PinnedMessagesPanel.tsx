"use client";

import { format } from "date-fns";
import { Pin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import type { PinnedMessageWithDetails } from "@/types/chat";

export function PinnedMessagesPanel({
  open,
  onOpenChange,
  pinnedMessages,
  canUnpin,
  onUnpin,
  onJumpToMessage,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pinnedMessages: PinnedMessageWithDetails[];
  canUnpin: boolean;
  onUnpin: (messageId: string) => void;
  onJumpToMessage: (messageId: string) => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full max-w-md">
        <SheetHeader>
          <SheetTitle>Pinned Messages</SheetTitle>
        </SheetHeader>
        <div className="mt-4 space-y-3 overflow-y-auto">
          {pinnedMessages.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onJumpToMessage(item.messageId)}
              className="w-full rounded-xl border border-border p-3 text-left hover:bg-muted/50"
            >
              <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                <span>{item.message.author.name}</span>
                <span>{format(new Date(item.pinnedAt), "MMM d, p")}</span>
              </div>
              <p className="mt-2 line-clamp-2 text-sm">
                {item.message.body ?? (item.message.imageUrl ? "[Image]" : "Deleted message")}
              </p>
              {canUnpin ? (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="mt-2"
                  aria-label="Unpin message"
                  onClick={(event) => {
                    event.stopPropagation();
                    onUnpin(item.messageId);
                  }}
                >
                  <Pin className="mr-2 h-4 w-4" />
                  Unpin
                </Button>
              ) : null}
            </button>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
