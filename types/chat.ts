// AUDIT FIX: The chat system used partial ad-hoc types that were missing
// required interfaces, had no optimistic-message state, and could not model
// server-side reaction grouping or DM metadata safely. This file now exports
// the full typed contract used by the routes, hooks, and UI.
export const CHAT_ALLOWED_EMOJIS = ["🔥", "✅", "💎", "📈", "❌", "👀", "💯", "🚀"] as const;

export type ChatAllowedEmoji = (typeof CHAT_ALLOWED_EMOJIS)[number];

export type ApiResponse<T> = {
  data: T;
};

export type ChatMessageAuthor = {
  id: string;
  name: string;
  image: string | null;
};

export type MessageReactionGroup = {
  emoji: ChatAllowedEmoji;
  count: number;
  userIds: string[];
  hasReacted: boolean;
};

export type ChannelMemberWithUser = {
  id: string;
  channelId: string;
  userId: string;
  role: "MEMBER" | "MODERATOR" | "ADMIN";
  lastReadAt: string;
  joinedAt: string;
  isMuted: boolean;
  user: ChatMessageAuthor;
};

export type ChatReplyPreview = {
  id: string;
  body: string | null;
  imageUrl: string | null;
  hasImage: boolean;
  author: {
    name: string;
  };
};

export type ChatMessageWithAuthor = {
  id: string;
  channelId: string;
  authorId: string;
  body: string | null;
  imageUrl: string | null;
  imageWidth: number | null;
  imageHeight: number | null;
  imageName: string | null;
  replyToId: string | null;
  isEdited: boolean;
  isPinned: boolean;
  deletedAt: string | null;
  editedAt: string | null;
  createdAt: string;
  isDeleted: boolean;
  isPending: boolean;
  author: ChatMessageAuthor;
  reactions: MessageReactionGroup[];
  replyTo: ChatReplyPreview | null;
};

export type ChatChannelWithMeta = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  type: "GROUP" | "DM" | "ANNOUNCEMENT";
  isReadOnly: boolean;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
  unreadCount: number;
  memberCount: number;
  members: ChannelMemberWithUser[];
  dmUser: ChatMessageAuthor | null;
  lastMessage: {
    id: string;
    body: string | null;
    createdAt: string;
    authorName: string;
  } | null;
};

export type PinnedMessageWithDetails = {
  id: string;
  channelId: string;
  messageId: string;
  pinnedById: string;
  pinnedAt: string;
  message: ChatMessageWithAuthor;
};

export type TypingUser = {
  userId: string;
  userName: string;
  userAvatar: string | null;
};

export type MessagesPage = {
  messages: ChatMessageWithAuthor[];
  nextCursor: string | null;
  hasMore: boolean;
};

export type MessageDeletedEventPayload = {
  messageId: string;
  channelId: string;
};

export type MessageEditedEventPayload = {
  channelId: string;
  message: ChatMessageWithAuthor;
};

export type MessagePinnedEventPayload = {
  messageId: string;
  channelId: string;
  isPinned: boolean;
};

export type ReactionUpdatedEventPayload = {
  messageId: string;
  channelId: string;
  reactions: MessageReactionGroup[];
};

// AUDIT FIX: ChatReactionSummary was imported by useChatRealtime.ts but never
// exported. It is identical to MessageReactionGroup — add the alias here.
export type ChatReactionSummary = MessageReactionGroup;
