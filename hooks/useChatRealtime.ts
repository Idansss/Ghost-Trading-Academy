"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient, type InfiniteData } from "@tanstack/react-query";
import { getPusherClient } from "@/lib/pusher-client";
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

// AUDIT FIX: Realtime updates previously leaked subscriptions, used multiple
// channel naming schemes, and did not maintain sidebar cache state. This hook
// now owns all chat realtime subscriptions with typed payloads and cleanup.
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

  const subscribedChannelIds = useMemo(
    () => channels.map((channel) => channel.id).sort(),
    [channels],
  );

  useEffect(() => {
    if (!channelId) {
      return;
    }

    const pusher = getPusherClient();
    if (!pusher) {
      return;
    }

    const subscribedChannels = subscribedChannelIds.map((subscribedChannelId) =>
      pusher.subscribe(`chat-channel-${subscribedChannelId}`),
    );
    const activeReactionsChannel = pusher.subscribe(`reactions-${channelId}`);
    const activeTypingChannel = pusher.subscribe(`typing-${channelId}`);
    const adminChannel = pusher.subscribe("admin-chat");

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

    const handleConnected = () => {
      setConnectionState("connected");
    };

    const handleDisconnected = () => {
      setConnectionState("disconnected");
    };

    const handleNewChannel = (channel: ChatChannelWithMeta) => {
      queryClient.setQueryData<ChatChannelWithMeta[] | undefined>(channelQueryKey, (existingChannels) => {
        if (!existingChannels) {
          return [channel];
        }

        if (existingChannels.some((existingChannel) => existingChannel.id === channel.id)) {
          return existingChannels;
        }

        return [channel, ...existingChannels].sort((left, right) => {
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

    subscribedChannels.forEach((subscribedChannel) => {
      subscribedChannel.bind("new-message", handleNewMessage);

      if (subscribedChannel.name === `chat-channel-${channelId}`) {
        subscribedChannel.bind("message-edited", handleEditedMessage);
        subscribedChannel.bind("message-deleted", handleDeletedMessage);
        subscribedChannel.bind("message-pinned", handlePinUpdated);
      }
    });

    activeReactionsChannel.bind("reaction-updated", handleReactionUpdated);
    activeTypingChannel.bind("typing-start", handleTypingStart);
    activeTypingChannel.bind("typing-stop", handleTypingStop);
    adminChannel.bind("new-channel", handleNewChannel);

    pusher.connection.bind("connected", handleConnected);
    pusher.connection.bind("disconnected", handleDisconnected);

    return () => {
      subscribedChannels.forEach((subscribedChannel) => {
        subscribedChannel.unbind_all();
        pusher.unsubscribe(subscribedChannel.name);
      });

      activeReactionsChannel.unbind_all();
      activeTypingChannel.unbind_all();
      adminChannel.unbind_all();
      pusher.unsubscribe(`reactions-${channelId}`);
      pusher.unsubscribe(`typing-${channelId}`);
      pusher.unsubscribe("admin-chat");
      pusher.connection.unbind("connected", handleConnected);
      pusher.connection.unbind("disconnected", handleDisconnected);

      typingTimeouts.current.forEach((timeout) => window.clearTimeout(timeout));
      typingTimeouts.current.clear();
      setTypingUsers([]);
    };
  }, [channelId, currentUserId, queryClient, subscribedChannelIds]);

  return {
    typingUsers,
    isDisconnected: connectionState === "disconnected",
  };
}
