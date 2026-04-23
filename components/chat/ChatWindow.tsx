"use client";

import { differenceInMinutes, format, isSameDay, isToday, isYesterday } from "date-fns";
import { ArrowLeft, Pin } from "lucide-react";
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { toast } from "sonner";
import { ChatImageLightbox } from "@/components/chat/ChatImageLightbox";
import { ChatMessage } from "@/components/chat/ChatMessage";
import { MessageComposer } from "@/components/chat/MessageComposer";
import { PinnedMessagesPanel } from "@/components/chat/PinnedMessagesPanel";
import { Button } from "@/components/ui/button";
import {
  useDeleteMessage,
  useEditMessage,
  useMarkAsRead,
  useMessages,
  usePinnedMessages,
  useSendMessage,
  useTogglePin,
  useToggleReaction,
} from "@/hooks/useChat";
import { useChatRealtime } from "@/hooks/useChatRealtime";
// AUDIT FIX: ChatReplyPreview was imported but not directly used in this component.
import type { ChatChannelWithMeta, ChatMessageWithAuthor } from "@/types/chat";

type TimelineItem =
  | { type: "date"; key: string; label: string }
  | { type: "message"; key: string; message: ChatMessageWithAuthor; grouped: boolean };

function formatDividerLabel(date: Date): string {
  if (isToday(date)) {
    return "Today";
  }
  if (isYesterday(date)) {
    return "Yesterday";
  }
  return format(date, "MMMM d, yyyy");
}

export function ChatWindow({
  channel,
  channels,
  onBackMobile,
}: {
  channel: ChatChannelWithMeta;
  channels: ChatChannelWithMeta[];
  onBackMobile: () => void;
}) {
  const { data: session } = useSession();
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const previousLastMessageIdRef = useRef<string | null>(null);
  const initialScrollDoneRef = useRef(false);
  const preservedScrollHeightRef = useRef<number | null>(null);
  const [replyTo, setReplyTo] = useState<ChatMessageWithAuthor | null>(null);
  const [editingMessage, setEditingMessage] = useState<ChatMessageWithAuthor | null>(null);
  const [lightboxImage, setLightboxImage] = useState<{ url: string; name: string | null } | null>(null);
  const [pinnedOpen, setPinnedOpen] = useState(false);
  const [showNewMessagesBadge, setShowNewMessagesBadge] = useState(false);
  const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null);

  const messagesQuery = useMessages(channel.id);
  const pinnedQuery = usePinnedMessages(channel.id);
  const sendMutation = useSendMessage(channel.id);
  const deleteMutation = useDeleteMessage(channel.id);
  const editMutation = useEditMessage(channel.id);
  const reactionMutation = useToggleReaction(channel.id);
  const pinMutation = useTogglePin(channel.id);
  const markAsReadMutation = useMarkAsRead(channel.id);

  const realtime = useChatRealtime({
    channelId: channel.id,
    currentUserId: session?.user.id ?? "",
    channels,
  });

  const allMessages = useMemo(
    () =>
      messagesQuery.data?.pages
        .flatMap((page) => page.messages)
        .slice()
        .reverse() ?? [],
    [messagesQuery.data],
  );

  const memberNameById = useMemo(
    () =>
      Object.fromEntries(
        channel.members.map((member) => [member.user.id, member.user.name]),
      ),
    [channel.members],
  );

  const timelineItems = useMemo<TimelineItem[]>(() => {
    const items: TimelineItem[] = [];

    allMessages.forEach((message, index) => {
      const currentDate = new Date(message.createdAt);
      const previousMessage = index > 0 ? allMessages[index - 1] : null;

      if (!previousMessage || !isSameDay(currentDate, new Date(previousMessage.createdAt))) {
        items.push({
          type: "date",
          key: `date-${currentDate.toISOString()}`,
          label: formatDividerLabel(currentDate),
        });
      }

      const grouped =
        Boolean(previousMessage) &&
        !message.replyTo &&
        isSameDay(currentDate, new Date(previousMessage!.createdAt)) &&
        previousMessage!.authorId === message.authorId &&
        differenceInMinutes(currentDate, new Date(previousMessage!.createdAt)) <= 5;

      items.push({
        type: "message",
        key: message.id,
        message,
        grouped,
      });
    });

    return items;
  }, [allMessages]);

  const virtualizer = useVirtualizer({
    count: timelineItems.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: (index) => {
      const item = timelineItems[index];
      if (!item) {
        return 60;
      }
      if (item.type === "date") {
        return 36;
      }
      return item.message.imageUrl ? 280 : 60;
    },
    enabled: timelineItems.length > 200,
    overscan: 10,
  });

  // AUDIT FIX: Wrap in useCallback so useLayoutEffect can safely list it as a
  // dependency, eliminating the react-hooks/exhaustive-deps ESLint warning.
  const scrollToBottom = useCallback((): void => {
    const element = scrollRef.current;
    if (!element) {
      return;
    }

    element.scrollTop = element.scrollHeight;
    setShowNewMessagesBadge(false);
    void markAsReadMutation.mutateAsync().catch(() => undefined);
  }, [markAsReadMutation]);

  // AUDIT FIX: Switching channels now resets scroll/highlight/reply state so
  // previous-channel UI state does not bleed into the new conversation.
  // AUDIT FIX: Typing-stop event was never sent when a user switched channels
  // while their typing indicator was active, leaving "X is typing…" stuck in
  // the old channel for all other users until the 5-second timeout expired.
  // The cleanup function fires with the OLD channel.id before the new effect
  // runs, so it correctly stops the typing indicator on the departing channel.
  useEffect(() => {
    return () => {
      void fetch("/api/chat/typing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channelId: channel.id, isTyping: false }),
      }).catch(() => undefined);
    };
  }, [channel.id]);

  useEffect(() => {
    initialScrollDoneRef.current = false;
    previousLastMessageIdRef.current = null;
    preservedScrollHeightRef.current = null;
    setReplyTo(null);
    setEditingMessage(null);
    setShowNewMessagesBadge(false);
    setHighlightedMessageId(null);
  }, [channel.id]);

  useLayoutEffect(() => {
    if (!scrollRef.current || !allMessages.length || initialScrollDoneRef.current) {
      return;
    }

    // AUDIT FIX: Initial channel load now snaps to the latest message so the
    // user starts at the bottom of the conversation, not the oldest message.
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    initialScrollDoneRef.current = true;
    void markAsReadMutation.mutateAsync().catch(() => undefined);
  }, [allMessages.length, markAsReadMutation]);

  useLayoutEffect(() => {
    const element = scrollRef.current;
    if (!element || preservedScrollHeightRef.current === null) {
      return;
    }

    const previousHeight = preservedScrollHeightRef.current;
    preservedScrollHeightRef.current = null;
    element.scrollTop = element.scrollHeight - previousHeight;
  }, [allMessages.length]);

  useLayoutEffect(() => {
    const currentLastMessage = allMessages[allMessages.length - 1];
    const previousLastMessageId = previousLastMessageIdRef.current;

    if (!currentLastMessage) {
      previousLastMessageIdRef.current = null;
      return;
    }

    const element = scrollRef.current;
    const isNearBottom =
      !element ||
      element.scrollHeight - element.scrollTop - element.clientHeight < 100;

    if (
      previousLastMessageId &&
      previousLastMessageId !== currentLastMessage.id
    ) {
      if (isNearBottom || currentLastMessage.authorId === session?.user.id) {
        scrollToBottom();
      } else {
        setShowNewMessagesBadge(true);
      }
    }

    previousLastMessageIdRef.current = currentLastMessage.id;
  }, [allMessages, scrollToBottom, session?.user.id]);

  // AUDIT FIX: Previously used document.getElementById which does not work for
  // messages that have been removed from the DOM by the virtualizer (>200 items).
  // Now finds the timeline index and uses virtualizer.scrollToIndex when the
  // virtualizer is active, falling back to DOM scroll for the non-virtual path.
  const jumpToMessage = (messageId: string): void => {
    const index = timelineItems.findIndex(
      (item) => item.type === "message" && item.message.id === messageId,
    );

    if (index !== -1 && timelineItems.length > 200) {
      virtualizer.scrollToIndex(index, { behavior: "smooth" });
    } else {
      const element = document.getElementById(`message-${messageId}`);
      element?.scrollIntoView({ behavior: "smooth", block: "center" });
    }

    setHighlightedMessageId(messageId);
    window.setTimeout(
      () => setHighlightedMessageId((currentValue) => (currentValue === messageId ? null : currentValue)),
      2000,
    );
  };

  return (
    <div className="flex h-full flex-col bg-background">
      {realtime.isDisconnected ? (
        <div className="bg-amber-500/20 px-3 py-1 text-xs text-amber-950">
          Connection lost - trying to reconnect…
        </div>
      ) : null}

      {/* AUDIT FIX: The channel header now shows the actual channel identity and
          keeps the mobile back affordance available without shifting layout. */}
      <div className="flex items-center justify-between border-b border-border px-3 py-3">
        <div className="flex min-w-0 items-center gap-2">
          <Button type="button" className="md:hidden" variant="ghost" size="icon" onClick={onBackMobile} aria-label="Back to channels">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-0">
            <h3 className="truncate text-sm font-semibold">{channel.name}</h3>
            <p className="truncate text-xs text-muted-foreground">
              {channel.type === "DM" ? "Direct message" : channel.description ?? channel.slug}
            </p>
          </div>
        </div>
        <Button type="button" size="sm" variant="outline" onClick={() => setPinnedOpen(true)} aria-label="Open pinned messages">
          <Pin className="mr-2 h-4 w-4" />
          Pinned
        </Button>
      </div>

      {pinnedQuery.data && pinnedQuery.data.length > 0 ? (
        <button
          type="button"
          className="border-b border-border bg-muted/40 px-3 py-2 text-left text-sm hover:bg-muted/60"
          onClick={() => setPinnedOpen(true)}
        >
          <span className="font-medium">Pinned messages</span>
          <span className="ml-2 text-muted-foreground">{pinnedQuery.data.length}</span>
        </button>
      ) : null}

      <div
        ref={scrollRef}
        role="log"
        aria-live="polite"
        aria-label="Messages"
        className="relative flex-1 overflow-y-auto px-2 py-2"
        onScroll={() => {
          const element = scrollRef.current;
          if (!element) {
            return;
          }

          const isNearBottom =
            element.scrollHeight - element.scrollTop - element.clientHeight < 100;
          if (isNearBottom) {
            void markAsReadMutation.mutateAsync().catch(() => undefined);
            setShowNewMessagesBadge(false);
          }

          if (
            element.scrollTop <= 100 &&
            messagesQuery.hasNextPage &&
            !messagesQuery.isFetchingNextPage
          ) {
            preservedScrollHeightRef.current = element.scrollHeight;
            void messagesQuery.fetchNextPage();
          }
        }}
      >
        {messagesQuery.isLoading ? (
          <div className="space-y-3 p-3">
            {Array.from({ length: 8 }).map((_, index) => (
              <div
                key={index}
                className={`h-12 rounded-2xl bg-muted/50 ${index % 2 === 0 ? "mr-10" : "ml-10"}`}
              />
            ))}
          </div>
        ) : timelineItems.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center text-muted-foreground">
            <p>No messages yet. Be the first to post in this channel.</p>
          </div>
        ) : timelineItems.length > 200 ? (
          <div style={{ height: `${virtualizer.getTotalSize()}px`, position: "relative" }}>
            {virtualizer.getVirtualItems().map((virtualItem) => {
              const item = timelineItems[virtualItem.index];
              if (!item) {
                return null;
              }

              return (
                <div
                  key={item.key}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    transform: `translateY(${virtualItem.start}px)`,
                  }}
                >
                  {item.type === "date" ? (
                    <div className="py-3 text-center text-xs font-medium text-muted-foreground">
                      {item.label}
                    </div>
                  ) : (
                    <ChatMessage
                      message={item.message}
                      grouped={item.grouped}
                      highlighted={highlightedMessageId === item.message.id}
                      canModerate={session?.user.role === "ADMIN"}
                      canEdit={session?.user.id === item.message.authorId}
                      reactorNamesById={memberNameById}
                      onReply={setReplyTo}
                      onEdit={setEditingMessage}
                      onDelete={(messageId) => {
                        void deleteMutation.mutateAsync(messageId).catch((error: Error) => toast.error(error.message));
                      }}
                      onPin={(messageId) => {
                        void pinMutation.mutateAsync(messageId).catch((error: Error) => toast.error(error.message));
                      }}
                      onReact={(messageId, emoji) => {
                        void reactionMutation.mutateAsync({ messageId, emoji }).catch((error: Error) => toast.error(error.message));
                      }}
                      onOpenImage={setLightboxImage}
                      onJumpToMessage={jumpToMessage}
                    />
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="space-y-1">
            {timelineItems.map((item) =>
              item.type === "date" ? (
                <div key={item.key} className="py-3 text-center text-xs font-medium text-muted-foreground">
                  {item.label}
                </div>
              ) : (
                <ChatMessage
                  key={item.key}
                  message={item.message}
                  grouped={item.grouped}
                  highlighted={highlightedMessageId === item.message.id}
                  canModerate={session?.user.role === "ADMIN"}
                  canEdit={session?.user.id === item.message.authorId}
                  reactorNamesById={memberNameById}
                  onReply={setReplyTo}
                  onEdit={setEditingMessage}
                  onDelete={(messageId) => {
                    void deleteMutation.mutateAsync(messageId).catch((error: Error) => toast.error(error.message));
                  }}
                  onPin={(messageId) => {
                    void pinMutation.mutateAsync(messageId).catch((error: Error) => toast.error(error.message));
                  }}
                  onReact={(messageId, emoji) => {
                    void reactionMutation.mutateAsync({ messageId, emoji }).catch((error: Error) => toast.error(error.message));
                  }}
                  onOpenImage={setLightboxImage}
                  onJumpToMessage={jumpToMessage}
                />
              ),
            )}
          </div>
        )}

        {messagesQuery.isFetchingNextPage ? (
          <div className="sticky top-0 z-10 flex justify-center py-2 text-xs text-muted-foreground">
            Loading older messages...
          </div>
        ) : null}
      </div>

      {showNewMessagesBadge ? (
        <div className="px-3 pb-2">
          <Button type="button" size="sm" variant="secondary" onClick={scrollToBottom}>
            New messages ↓
          </Button>
        </div>
      ) : null}

      <div className="px-3 pb-1 text-xs text-muted-foreground">
        {realtime.typingUsers.length > 0
          ? `${realtime.typingUsers[0].userName} is typing...`
          : ""}
      </div>

      <MessageComposer
        channelName={channel.name}
        isReadOnly={channel.isReadOnly}
        canPost={channel.isReadOnly ? session?.user.role === "ADMIN" : true}
        replyTo={replyTo}
        editingMessage={editingMessage}
        onCancelReply={() => setReplyTo(null)}
        onCancelEdit={() => setEditingMessage(null)}
        onTyping={(isTyping) => {
          void fetch("/api/chat/typing", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ channelId: channel.id, isTyping }),
          }).catch(() => undefined);
        }}
        onSubmit={async (payload) => {
          if (payload.editMessageId) {
            await editMutation.mutateAsync({
              messageId: payload.editMessageId,
              body: payload.body ?? "",
            });
            return;
          }

          await sendMutation.mutateAsync({
            body: payload.body,
            imageUrl: payload.image?.url,
            imageName: payload.image?.name,
            imageWidth: payload.image?.width,
            imageHeight: payload.image?.height,
            replyToId: payload.replyToId,
            replyTo: payload.replyTo ?? null,
          });
        }}
      />

      <PinnedMessagesPanel
        open={pinnedOpen}
        onOpenChange={setPinnedOpen}
        pinnedMessages={pinnedQuery.data ?? []}
        canUnpin={session?.user.role === "ADMIN"}
        onUnpin={(messageId) => {
          void pinMutation.mutateAsync(messageId).catch((error: Error) => toast.error(error.message));
        }}
        onJumpToMessage={(messageId) => {
          setPinnedOpen(false);
          jumpToMessage(messageId);
        }}
      />

      <ChatImageLightbox
        open={Boolean(lightboxImage)}
        imageUrl={lightboxImage?.url ?? null}
        imageName={lightboxImage?.name ?? null}
        onClose={() => setLightboxImage(null)}
      />
    </div>
  );
}
