"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient, type InfiniteData } from "@tanstack/react-query";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";
import type {
  ChatChannelWithMeta,
  ChatMessageWithAuthor,
  MessageDeletedEventPayload,
  MessageEditedEventPayload,
  MessagePinnedEventPayload,
  MessagesPage,
  ReactionUpdatedEventPayload,
  TypingUser,
} from "@/types/chat";

type UseChatRealtimeOptions = {
  channelId: string;
  currentUserId: string;
  channels: ChatChannelWithMeta[];
};

const channelQueryKey = ["chat", "channels"] as const;

function messageQueryKey(channelId: string) {
  return ["chat", "messages", channelId] as const;
}

function pinnedQueryKey(channelId: string) {
  return ["chat", "pinned", channelId] as const;
}

/** Supabase passes our JSON body as `payload` on broadcast callbacks. */
function asPayload<T>(raw: unknown): T {
  if (raw && typeof raw === "object" && "payload" in raw) {
    return (raw as { payload: T }).payload;
  }
  return raw as T;
}

export function useChatRealtime({
  channelId,
  currentUserId,
  channels,
}: UseChatRealtimeOptions): {
  typingUsers: TypingUser[];
  isDisconnected: boolean;
} {
  const queryClient = useQueryClient();
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [connectionState, setConnectionState] = useState<"connected" | "disconnected">("connected");
  const typingTimeouts = useRef<Map<string, number>>(new Map());

  const subscribedChannelKey = useMemo(
    () =>
      channels
        .map((c) => c.id)
        .sort()
        .join(","),
    [channels],
  );

  useEffect(() => {
    if (!channelId) {
      return;
    }

    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      return;
    }

    const upsertTimelineMessage = (incomingMessage: ChatMessageWithAuthor) => {
      queryClient.setQueryData<InfiniteData<MessagesPage>>(messageQueryKey(channelId), (existingData) => {
        if (!existingData?.pages.length) {
          return {
            pageParams: [undefined],
            pages: [
              {
                messages: [incomingMessage],
                nextCursor: null,
                hasMore: false,
              },
            ],
          };
        }

        const alreadyExists = existingData.pages.some((page) =>
          page.messages.some((message) => message.id === incomingMessage.id),
        );
        if (alreadyExists) {
          return existingData;
        }

        return {
          ...existingData,
          pages: [
            {
              ...existingData.pages[0],
              messages: [incomingMessage, ...existingData.pages[0].messages],
            },
            ...existingData.pages.slice(1),
          ],
        };
      });
    };

    const updateMessage = (
      targetChannelId: string,
      updater: (message: ChatMessageWithAuthor) => ChatMessageWithAuthor,
    ) => {
      queryClient.setQueryData<InfiniteData<MessagesPage>>(messageQueryKey(targetChannelId), (existingData) => {
        if (!existingData) {
          return existingData;
        }

        return {
          ...existingData,
          pages: existingData.pages.map((page) => ({
            ...page,
            messages: page.messages.map((message) => updater(message)),
          })),
        };
      });
    };

    const updateChannelPreview = (
      incomingMessage: ChatMessageWithAuthor,
      isActiveChannel: boolean,
    ) => {
      queryClient.setQueryData<ChatChannelWithMeta[] | undefined>(channelQueryKey, (existingChannels) => {
        if (!existingChannels) {
          return existingChannels;
        }

        const updatedChannels = existingChannels.map((channel) =>
          channel.id === incomingMessage.channelId
            ? {
                ...channel,
                updatedAt: incomingMessage.createdAt,
                unreadCount:
                  isActiveChannel || incomingMessage.authorId === currentUserId
                    ? 0
                    : channel.unreadCount + 1,
                lastMessage: {
                  id: incomingMessage.id,
                  body: incomingMessage.body
                    ? `${incomingMessage.body.slice(0, 60)}${incomingMessage.body.length > 60 ? "..." : ""}`
                    : incomingMessage.imageUrl
                      ? "[Image]"
                      : null,
                  authorName: incomingMessage.author.name,
                  createdAt: incomingMessage.createdAt,
                },
              }
            : channel,
        );

        return updatedChannels.sort((left, right) => {
          const getPriority = (type: ChatChannelWithMeta["type"]): number => {
            if (type === "ANNOUNCEMENT") return 0;
            if (type === "GROUP") return 1;
            return 2;
          };

          const typeOrder = getPriority(left.type) - getPriority(right.type);
          if (typeOrder !== 0) {
            return typeOrder;
          }

          return (
            new Date(right.lastMessage?.createdAt ?? right.updatedAt).getTime() -
            new Date(left.lastMessage?.createdAt ?? left.updatedAt).getTime()
          );
        });
      });
    };

    const handleNewMessage = (incomingMessage: ChatMessageWithAuthor) => {
      const isActiveChannel = incomingMessage.channelId === channelId;
      updateChannelPreview(incomingMessage, isActiveChannel);

      if (!isActiveChannel) {
        return;
      }

      if (incomingMessage.authorId === currentUserId) {
        return;
      }

      upsertTimelineMessage(incomingMessage);
    };

    const handleEditedMessage = (payload: MessageEditedEventPayload) => {
      if (payload.channelId !== channelId) {
        return;
      }

      updateMessage(channelId, (message) => (message.id === payload.message.id ? payload.message : message));
    };

    const handleDeletedMessage = (payload: MessageDeletedEventPayload) => {
      if (payload.channelId !== channelId) {
        return;
      }

      updateMessage(channelId, (message) =>
        message.id === payload.messageId
          ? {
              ...message,
              body: null,
              imageUrl: null,
              imageWidth: null,
              imageHeight: null,
              imageName: null,
              isDeleted: true,
              deletedAt: new Date().toISOString(),
            }
          : message,
      );
    };

    const handleReactionUpdated = (payload: ReactionUpdatedEventPayload) => {
      if (payload.channelId !== channelId) {
        return;
      }

      updateMessage(channelId, (message) =>
        message.id === payload.messageId
          ? {
              ...message,
              reactions: payload.reactions,
            }
          : message,
      );
    };

    const handlePinUpdated = (payload: MessagePinnedEventPayload) => {
      if (payload.channelId !== channelId) {
        return;
      }

      updateMessage(channelId, (message) =>
        message.id === payload.messageId
          ? {
              ...message,
              isPinned: payload.isPinned,
            }
          : message,
      );
      void queryClient.invalidateQueries({ queryKey: pinnedQueryKey(channelId) });
    };

    const handleTypingStart = (typingUser: TypingUser) => {
      if (typingUser.userId === currentUserId) {
        return;
      }

      const existingTimeout = typingTimeouts.current.get(typingUser.userId);
      if (existingTimeout) {
        window.clearTimeout(existingTimeout);
      }

      setTypingUsers((currentTypingUsers) =>
        currentTypingUsers.some((user) => user.userId === typingUser.userId)
          ? currentTypingUsers.map((user) => (user.userId === typingUser.userId ? typingUser : user))
          : [...currentTypingUsers, typingUser],
      );

      const timeout = window.setTimeout(() => {
        setTypingUsers((currentTypingUsers) =>
          currentTypingUsers.filter((user) => user.userId !== typingUser.userId),
        );
        typingTimeouts.current.delete(typingUser.userId);
      }, 5000);

      typingTimeouts.current.set(typingUser.userId, timeout);
    };

    const handleTypingStop = ({ userId }: { userId: string }) => {
      const existingTimeout = typingTimeouts.current.get(userId);
      if (existingTimeout) {
        window.clearTimeout(existingTimeout);
        typingTimeouts.current.delete(userId);
      }

      setTypingUsers((currentTypingUsers) =>
        currentTypingUsers.filter((user) => user.userId !== userId),
      );
    };

    const handleNewChannel = (next: ChatChannelWithMeta) => {
      queryClient.setQueryData<ChatChannelWithMeta[] | undefined>(channelQueryKey, (existingChannels) => {
        if (!existingChannels) {
          return [next];
        }

        if (existingChannels.some((existingChannel) => existingChannel.id === next.id)) {
          return existingChannels;
        }

        return [next, ...existingChannels].sort((left, right) => {
          const getPriority = (type: ChatChannelWithMeta["type"]): number => {
            if (type === "ANNOUNCEMENT") return 0;
            if (type === "GROUP") return 1;
            return 2;
          };

          const typeOrder = getPriority(left.type) - getPriority(right.type);
          if (typeOrder !== 0) {
            return typeOrder;
          }

          return (
            new Date(right.lastMessage?.createdAt ?? right.updatedAt).getTime() -
            new Date(left.lastMessage?.createdAt ?? left.updatedAt).getTime()
          );
        });
      });
    };

    const broadcastOpts = { config: { broadcast: { self: true } } };

    const subscribedChannelIds = subscribedChannelKey.split(",").filter(Boolean);

    const chatChannels = subscribedChannelIds.map((subscribedChannelId) => {
      const name = `chat-channel-${subscribedChannelId}`;
      const ch = supabase.channel(name, broadcastOpts);
      ch.on("broadcast", { event: "new-message" }, (msg) => {
        handleNewMessage(asPayload<ChatMessageWithAuthor>(msg));
      });
      if (subscribedChannelId === channelId) {
        ch.on("broadcast", { event: "message-edited" }, (msg) => {
          handleEditedMessage(asPayload<MessageEditedEventPayload>(msg));
        });
        ch.on("broadcast", { event: "message-deleted" }, (msg) => {
          handleDeletedMessage(asPayload<MessageDeletedEventPayload>(msg));
        });
        ch.on("broadcast", { event: "message-pinned" }, (msg) => {
          handlePinUpdated(asPayload<MessagePinnedEventPayload>(msg));
        });
      }
      ch.subscribe();
      return ch;
    });

    const activeReactionsChannel = supabase.channel(`reactions-${channelId}`, broadcastOpts);
    activeReactionsChannel.on("broadcast", { event: "reaction-updated" }, (msg) => {
      handleReactionUpdated(asPayload<ReactionUpdatedEventPayload>(msg));
    });
    activeReactionsChannel.subscribe();

    const activeTypingChannel = supabase.channel(`typing-${channelId}`, broadcastOpts);
    activeTypingChannel.on("broadcast", { event: "typing-start" }, (msg) => {
      handleTypingStart(asPayload<TypingUser>(msg));
    });
    activeTypingChannel.on("broadcast", { event: "typing-stop" }, (msg) => {
      handleTypingStop(asPayload<{ userId: string }>(msg));
    });
    activeTypingChannel.subscribe();

    const adminChannel = supabase.channel("admin-chat", broadcastOpts);
    adminChannel.on("broadcast", { event: "new-channel" }, (msg) => {
      handleNewChannel(asPayload<ChatChannelWithMeta>(msg));
    });
    adminChannel.subscribe();

    const poll = window.setInterval(() => {
      setConnectionState(supabase.realtime.isConnected() ? "connected" : "disconnected");
    }, 1500);

    return () => {
      window.clearInterval(poll);
      chatChannels.forEach((ch) => {
        void supabase.removeChannel(ch);
      });
      void supabase.removeChannel(activeReactionsChannel);
      void supabase.removeChannel(activeTypingChannel);
      void supabase.removeChannel(adminChannel);

      typingTimeouts.current.forEach((timeout) => window.clearTimeout(timeout));
      typingTimeouts.current.clear();
      setTypingUsers([]);
    };
  }, [channelId, currentUserId, queryClient, subscribedChannelKey]);

  return {
    typingUsers,
    isDisconnected: connectionState === "disconnected",
  };
}
