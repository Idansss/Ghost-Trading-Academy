"use client";

import { useInfiniteQuery, useMutation, useQuery, useQueryClient, type InfiniteData } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { fetchJson } from "@/lib/client-api";
import type {
  ApiResponse,
  ChatChannelWithMeta,
  ChatMessageWithAuthor,
  ChatReplyPreview,
  MessagePinnedEventPayload,
  MessagesPage,
  PinnedMessageWithDetails,
  ReactionUpdatedEventPayload,
} from "@/types/chat";

const channelQueryKey = ["chat", "channels"] as const;

function messageQueryKey(channelId: string) {
  return ["chat", "messages", channelId] as const;
}

function pinnedQueryKey(channelId: string) {
  return ["chat", "pinned", channelId] as const;
}

function updateMessagesCache(
  existingData: InfiniteData<MessagesPage> | undefined,
  updater: (message: ChatMessageWithAuthor) => ChatMessageWithAuthor,
): InfiniteData<MessagesPage> | undefined {
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
}

function prependMessage(
  existingData: InfiniteData<MessagesPage> | undefined,
  message: ChatMessageWithAuthor,
): InfiniteData<MessagesPage> {
  if (!existingData?.pages.length) {
    return {
      pageParams: [undefined],
      pages: [
        {
          messages: [message],
          nextCursor: null,
          hasMore: false,
        },
      ],
    };
  }

  return {
    ...existingData,
    pages: [
      {
        ...existingData.pages[0],
        messages: [message, ...existingData.pages[0].messages],
      },
      ...existingData.pages.slice(1),
    ],
  };
}

function replaceMessage(
  existingData: InfiniteData<MessagesPage> | undefined,
  matcher: (message: ChatMessageWithAuthor) => boolean,
  replacement: ChatMessageWithAuthor,
): InfiniteData<MessagesPage> | undefined {
  if (!existingData) {
    return existingData;
  }

  return {
    ...existingData,
    pages: existingData.pages.map((page) => ({
      ...page,
      messages: page.messages.map((message) => (matcher(message) ? replacement : message)),
    })),
  };
}

function updateChannelPreview(
  channels: ChatChannelWithMeta[] | undefined,
  channelId: string,
  previewMessage: ChatMessageWithAuthor,
  currentUserId: string,
  markUnread: boolean,
): ChatChannelWithMeta[] | undefined {
  if (!channels) {
    return channels;
  }

  return channels.map((channel) => {
    if (channel.id !== channelId) {
      return channel;
    }

    return {
      ...channel,
      updatedAt: previewMessage.createdAt,
      unreadCount:
        markUnread && previewMessage.authorId !== currentUserId
          ? channel.unreadCount + 1
          : channel.unreadCount,
      lastMessage: {
        id: previewMessage.id,
        body: previewMessage.body
          ? `${previewMessage.body.slice(0, 60)}${previewMessage.body.length > 60 ? "..." : ""}`
          : previewMessage.imageUrl
            ? "[Image]"
            : null,
        authorName: previewMessage.author.name,
        createdAt: previewMessage.createdAt,
      },
    };
  });
}

type SendMessagePayload = {
  body?: string;
  imageUrl?: string | null;
  imageWidth?: number | null;
  imageHeight?: number | null;
  imageName?: string | null;
  replyToId?: string | null;
  replyTo?: ChatReplyPreview | null;
};

export function useChannels() {
  return useQuery({
    queryKey: channelQueryKey,
    staleTime: 1000 * 30,
    queryFn: async () => {
      try {
        const response = await fetchJson<ApiResponse<ChatChannelWithMeta[]>>("/api/chat/channels");
        return response.data;
      } catch (error) {
        toast.error("Failed to load channels");
        throw error;
      }
    },
  });
}

export function useMessages(channelId: string) {
  return useInfiniteQuery({
    queryKey: messageQueryKey(channelId),
    initialPageParam: undefined as string | undefined,
    queryFn: async ({ pageParam }) => {
      const response = await fetchJson<ApiResponse<MessagesPage>>(
        `/api/chat/channels/${channelId}/messages?limit=50${pageParam ? `&cursor=${pageParam}` : ""}`,
      );
      return response.data;
    },
    getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.nextCursor : undefined),
    enabled: Boolean(channelId),
  });
}

export function usePinnedMessages(channelId: string) {
  return useQuery({
    queryKey: pinnedQueryKey(channelId),
    queryFn: async () => {
      const response = await fetchJson<ApiResponse<PinnedMessageWithDetails[]>>(
        `/api/chat/channels/${channelId}/pinned`,
      );
      return response.data;
    },
    enabled: Boolean(channelId),
  });
}

export function useSendMessage(channelId: string) {
  const queryClient = useQueryClient();
  const { data: session } = useSession();

  return useMutation({
    mutationFn: async (payload: SendMessagePayload) => {
      const response = await fetchJson<ApiResponse<ChatMessageWithAuthor>>(
        `/api/chat/channels/${channelId}/messages`,
        {
          method: "POST",
          body: JSON.stringify(payload),
        },
      );
      return response.data;
    },
    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey: messageQueryKey(channelId) });
      const previousMessages = queryClient.getQueryData<InfiniteData<MessagesPage>>(messageQueryKey(channelId));
      const previousChannels = queryClient.getQueryData<ChatChannelWithMeta[]>(channelQueryKey);
      const tempId = crypto.randomUUID();
      const optimisticMessage: ChatMessageWithAuthor = {
        id: tempId,
        channelId,
        authorId: session?.user.id ?? "unknown",
        body: payload.body?.trim() || null,
        imageUrl: payload.imageUrl ?? null,
        imageWidth: payload.imageWidth ?? null,
        imageHeight: payload.imageHeight ?? null,
        imageName: payload.imageName ?? null,
        replyToId: payload.replyToId ?? null,
        isEdited: false,
        isPinned: false,
        deletedAt: null,
        editedAt: null,
        createdAt: new Date().toISOString(),
        isDeleted: false,
        isPending: true,
        author: {
          id: session?.user.id ?? "unknown",
          name: session?.user.name ?? "You",
          image: session?.user.avatarUrl ?? null,
        },
        reactions: [],
        replyTo: payload.replyTo ?? null,
      };

      queryClient.setQueryData<InfiniteData<MessagesPage>>(messageQueryKey(channelId), (existingData) =>
        prependMessage(existingData, optimisticMessage),
      );
      queryClient.setQueryData<ChatChannelWithMeta[] | undefined>(channelQueryKey, (channels) =>
        updateChannelPreview(channels, channelId, optimisticMessage, session?.user.id ?? "", false),
      );

      return { previousMessages, previousChannels, tempId };
    },
    onError: (error: Error, _payload, context) => {
      if (context?.previousMessages) {
        queryClient.setQueryData(messageQueryKey(channelId), context.previousMessages);
      }
      if (context?.previousChannels) {
        queryClient.setQueryData(channelQueryKey, context.previousChannels);
      }
      toast.error(error.message || "Failed to send message");
      console.error("[useSendMessage]", error);
    },
    onSuccess: (message, _payload, context) => {
      queryClient.setQueryData<InfiniteData<MessagesPage>>(messageQueryKey(channelId), (existingData) =>
        replaceMessage(existingData, (currentMessage) => currentMessage.id === context?.tempId, message) ??
        prependMessage(existingData, message),
      );
      queryClient.setQueryData<ChatChannelWithMeta[] | undefined>(channelQueryKey, (channels) =>
        updateChannelPreview(channels, channelId, message, session?.user.id ?? "", false),
      );
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: messageQueryKey(channelId) });
      await queryClient.invalidateQueries({ queryKey: channelQueryKey });
    },
  });
}

export function useDeleteMessage(channelId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (messageId: string) => {
      const response = await fetchJson<ApiResponse<{ messageId: string; channelId: string }>>(
        `/api/chat/messages/${messageId}`,
        { method: "DELETE" },
      );
      return response.data;
    },
    onMutate: async (messageId) => {
      await queryClient.cancelQueries({ queryKey: messageQueryKey(channelId) });
      const previousMessages = queryClient.getQueryData<InfiniteData<MessagesPage>>(messageQueryKey(channelId));
      queryClient.setQueryData<InfiniteData<MessagesPage>>(messageQueryKey(channelId), (existingData) =>
        updateMessagesCache(existingData, (message) =>
          message.id === messageId
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
        ),
      );
      return { previousMessages };
    },
    onError: (_error: Error, _messageId, context) => {
      if (context?.previousMessages) {
        queryClient.setQueryData(messageQueryKey(channelId), context.previousMessages);
      }
      toast.error("Failed to delete message");
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: messageQueryKey(channelId) });
    },
  });
}

export function useEditMessage(channelId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ messageId, body }: { messageId: string; body: string }) => {
      const response = await fetchJson<ApiResponse<ChatMessageWithAuthor>>(`/api/chat/messages/${messageId}`, {
        method: "PATCH",
        body: JSON.stringify({ body }),
      });
      return response.data;
    },
    onMutate: async ({ messageId, body }) => {
      await queryClient.cancelQueries({ queryKey: messageQueryKey(channelId) });
      const previousMessages = queryClient.getQueryData<InfiniteData<MessagesPage>>(messageQueryKey(channelId));
      queryClient.setQueryData<InfiniteData<MessagesPage>>(messageQueryKey(channelId), (existingData) =>
        updateMessagesCache(existingData, (message) =>
          message.id === messageId
            ? {
                ...message,
                body,
                isEdited: true,
                editedAt: new Date().toISOString(),
                isPending: false,
              }
            : message,
        ),
      );
      return { previousMessages };
    },
    onError: (_error: Error, _variables, context) => {
      if (context?.previousMessages) {
        queryClient.setQueryData(messageQueryKey(channelId), context.previousMessages);
      }
      toast.error("Failed to update message");
    },
    onSuccess: (message) => {
      queryClient.setQueryData<InfiniteData<MessagesPage>>(messageQueryKey(channelId), (existingData) =>
        replaceMessage(existingData, (currentMessage) => currentMessage.id === message.id, message),
      );
    },
    // AUDIT FIX: useEditMessage had no invalidation step. A local setQueryData-only
    // update can silently drift from the server (e.g. if the server sanitises body).
    // onSettled refetches to guarantee cache parity.
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: messageQueryKey(channelId) });
    },
  });
}

export function useToggleReaction(channelId: string) {
  const queryClient = useQueryClient();
  const { data: session } = useSession();

  return useMutation({
    mutationFn: async ({ messageId, emoji }: { messageId: string; emoji: string }) => {
      const response = await fetchJson<ApiResponse<ReactionUpdatedEventPayload>>(
        `/api/chat/messages/${messageId}/react`,
        {
          method: "POST",
          body: JSON.stringify({ emoji }),
        },
      );
      return response.data;
    },
    onMutate: async ({ messageId, emoji }) => {
      await queryClient.cancelQueries({ queryKey: messageQueryKey(channelId) });
      const previousMessages = queryClient.getQueryData<InfiniteData<MessagesPage>>(messageQueryKey(channelId));
      queryClient.setQueryData<InfiniteData<MessagesPage>>(messageQueryKey(channelId), (existingData) =>
        updateMessagesCache(existingData, (message) => {
          if (message.id !== messageId) {
            return message;
          }

          const existingReaction = message.reactions.find((reaction) => reaction.emoji === emoji);
          if (!existingReaction) {
            return {
              ...message,
              reactions: [
                ...message.reactions,
                {
                  emoji: emoji as typeof message.reactions[number]["emoji"],
                  count: 1,
                  userIds: [session?.user.id ?? ""],
                  hasReacted: true,
                },
              ],
            };
          }

          if (existingReaction.hasReacted) {
            const updatedReactions = message.reactions
              .map((reaction) =>
                reaction.emoji === emoji
                  ? {
                      ...reaction,
                      count: Math.max(0, reaction.count - 1),
                      hasReacted: false,
                      userIds: reaction.userIds.filter((userId) => userId !== session?.user.id),
                    }
                  : reaction,
              )
              .filter((reaction) => reaction.count > 0);

            return {
              ...message,
              reactions: updatedReactions,
            };
          }

          return {
            ...message,
            reactions: message.reactions.map((reaction) =>
              reaction.emoji === emoji
                ? {
                    ...reaction,
                    count: reaction.count + 1,
                    hasReacted: true,
                    userIds: [...reaction.userIds, session?.user.id ?? ""],
                  }
                : reaction,
            ),
          };
        }),
      );

      return { previousMessages };
    },
    onError: (_error: Error, _variables, context) => {
      if (context?.previousMessages) {
        queryClient.setQueryData(messageQueryKey(channelId), context.previousMessages);
      }
      toast.error("Failed to update reaction");
    },
    onSuccess: (payload) => {
      queryClient.setQueryData<InfiniteData<MessagesPage>>(messageQueryKey(channelId), (existingData) =>
        updateMessagesCache(existingData, (message) =>
          message.id === payload.messageId
            ? {
                ...message,
                reactions: payload.reactions,
              }
            : message,
        ),
      );
    },
  });
}

export function useTogglePin(channelId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (messageId: string) => {
      const response = await fetchJson<ApiResponse<MessagePinnedEventPayload>>(
        `/api/chat/messages/${messageId}/pin`,
        {
          method: "PATCH",
        },
      );
      return response.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: messageQueryKey(channelId) });
      await queryClient.invalidateQueries({ queryKey: pinnedQueryKey(channelId) });
    },
    // AUDIT FIX: Missing onError handler — failed pin/unpin was silent in the UI.
    onError: (error: Error) => toast.error(error.message || "Failed to pin message"),
  });
}

export function useStartDM() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async (userId: string) => {
      const response = await fetchJson<ApiResponse<ChatChannelWithMeta>>(`/api/chat/dm/${userId}`, {
        method: "POST",
      });
      return response.data;
    },
    onSuccess: async (channel) => {
      await queryClient.invalidateQueries({ queryKey: channelQueryKey });
      router.push(`/community/chat?channel=${channel.id}`);
    },
    // AUDIT FIX: Missing onError handler — a failed DM start was silent in the UI.
    onError: (error: Error) => toast.error(error.message || "Failed to open direct message"),
  });
}

export function useCreateChannel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      name: string;
      description?: string | null;
      type: "GROUP" | "ANNOUNCEMENT" | "DM";
      isReadOnly?: boolean;
    }) => {
      const response = await fetchJson<ApiResponse<ChatChannelWithMeta>>("/api/chat/channels", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      return response.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: channelQueryKey });
    },
    // AUDIT FIX: Missing onError handler — a failed channel creation was silent in the UI.
    onError: (error: Error) => toast.error(error.message || "Failed to create channel"),
  });
}

export function useMarkAsRead(channelId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await fetchJson<ApiResponse<{ ok: true }>>(`/api/chat/channels/${channelId}/read`, {
        method: "PATCH",
      });
      return response.data;
    },
    onMutate: async () => {
      const previousChannels = queryClient.getQueryData<ChatChannelWithMeta[]>(channelQueryKey);
      queryClient.setQueryData<ChatChannelWithMeta[] | undefined>(channelQueryKey, (channels) =>
        channels?.map((channel) =>
          channel.id === channelId
            ? {
                ...channel,
                unreadCount: 0,
              }
            : channel,
        ),
      );
      return { previousChannels };
    },
    onError: (_error, _variables, context) => {
      if (context?.previousChannels) {
        queryClient.setQueryData(channelQueryKey, context.previousChannels);
      }
    },
  });
}
