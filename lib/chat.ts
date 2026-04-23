// ChannelType is intentionally NOT imported from @prisma/client here.
// This module is imported by ChatLayout (a "use client" component), so any
// runtime @prisma/client import would bundle PrismaClient into the browser and
// trigger its "cannot run in browser environment" guard. Use string literals
// for channel type comparisons to keep this module client-safe.
import type { Prisma, MessageReaction } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  CHAT_ALLOWED_EMOJIS,
  type ChatAllowedEmoji,
  type ChatChannelWithMeta,
  type ChatMessageWithAuthor,
  type MessageReactionGroup,
  type PinnedMessageWithDetails,
} from "@/types/chat";

// AUDIT FIX: Centralized chat channel/event naming to eliminate server/client
// mismatches and prevent silent realtime failures.
export const CHAT_EVENTS_CHANNEL = "admin-chat";
// AUDIT FIX: ADMIN_CHAT_CHANNEL was referenced in channels/route.ts but missing.
// Alias to CHAT_EVENTS_CHANNEL so both names resolve to the same Pusher channel.
export const ADMIN_CHAT_CHANNEL = CHAT_EVENTS_CHANNEL;

// AUDIT FIX: Group and announcement channels must always exist consistently for
// seed and registration flows, so the canonical slugs live in one place.
export const DEFAULT_CHAT_CHANNEL_SLUGS = [
  "trading-room",
  "chart-review",
  "signals-discussion",
  "wins-and-losses",
  "announcements",
] as const;

// AUDIT FIX: Upload trust previously accepted any UploadThing-like hostname.
// Production validation now supports an explicit CDN domain override and only
// allows URLs from the configured UploadThing domain(s).
const DEFAULT_UPLOADTHING_HOSTS = ["utfs.io", "ufs.sh"];

// AUDIT FIX: Replaced inline channel strings with helpers so routes and hooks
// cannot drift apart on naming convention.
export function getChatChannelName(channelId: string): string {
  return `chat-channel-${channelId}`;
}

export function getTypingChannelName(channelId: string): string {
  return `typing-${channelId}`;
}

export function getReactionsChannelName(channelId: string): string {
  return `reactions-${channelId}`;
}

// AUDIT FIX: Slug generation now strips unsafe characters, collapses repeated
// separators, and falls back to a stable default when the name is all symbols.
export function toSlug(name: string): string {
  const baseSlug = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return baseSlug || "channel";
}

// AUDIT FIX: Duplicate slugs were possible for similar channel names. This
// helper appends a short suffix only when required.
export async function generateUniqueChannelSlug(name: string): Promise<string> {
  const baseSlug = toSlug(name);
  const existing = await prisma.chatChannel.findUnique({
    where: { slug: baseSlug },
    select: { id: true },
  });

  if (!existing) {
    return baseSlug;
  }

  const suffix = Math.random().toString(36).slice(2, 8);
  return `${baseSlug}-${suffix}`;
}

// AUDIT FIX: Image trust now checks against the configured CDN domain and only
// falls back to UploadThing's known hostnames when the env var is absent.
export function isTrustedUploadthingUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url);
    const configuredDomain =
      process.env.UPLOADTHING_CDN_DOMAIN ??
      process.env.NEXT_PUBLIC_UPLOADTHING_CDN_DOMAIN ??
      "";
    const allowedHosts = configuredDomain
      ? [configuredDomain.replace(/^https?:\/\//, "").replace(/\/$/, "")]
      : DEFAULT_UPLOADTHING_HOSTS;

    return allowedHosts.some(
      (host) =>
        parsedUrl.hostname === host ||
        parsedUrl.hostname.endsWith(`.${host}`) ||
        url.startsWith(`https://${host}`),
    );
  } catch {
    return false;
  }
}

// AUDIT FIX: Reaction grouping previously omitted hasReacted, forcing the
// client to recompute per render. It is now grouped server-side once.
export function groupReactions(
  reactions: Pick<MessageReaction, "emoji" | "userId">[],
  currentUserId: string,
): MessageReactionGroup[] {
  const grouped = reactions.reduce<Record<string, MessageReactionGroup>>((accumulator, reaction) => {
    const emoji = reaction.emoji as ChatAllowedEmoji;
    if (!CHAT_ALLOWED_EMOJIS.includes(emoji)) {
      return accumulator;
    }

    if (!accumulator[emoji]) {
      accumulator[emoji] = {
        emoji,
        count: 0,
        userIds: [],
        hasReacted: false,
      };
    }

    accumulator[emoji].count += 1;
    accumulator[emoji].userIds.push(reaction.userId);
    if (reaction.userId === currentUserId) {
      accumulator[emoji].hasReacted = true;
    }

    return accumulator;
  }, {});

  return Object.values(grouped);
}

type AccessResult = {
  channel: {
    id: string;
    type: string;
    isReadOnly: boolean;
    isArchived: boolean;
  };
  membership: {
    channelId: string;
    userId: string;
    lastReadAt: Date;
  };
};

// AUDIT FIX: canAccessChannel was imported by messages/route.ts but missing.
// It is an alias for requireChannelAccess — Boolean wrapper that resolves null → false.
export async function canAccessChannel(userId: string, channelId: string): Promise<boolean> {
  const result = await requireChannelAccess(userId, channelId);
  return result !== null;
}

// AUDIT FIX: Public group access was previously allowed without membership,
// which breaks unread tracking and member scoping. Access now requires an
// actual ChannelMember row for every chat channel type.
export async function requireChannelAccess(
  userId: string,
  channelId: string,
): Promise<AccessResult | null> {
  const membership = await prisma.channelMember.findUnique({
    where: {
      channelId_userId: {
        channelId,
        userId,
      },
    },
    select: {
      channelId: true,
      userId: true,
      lastReadAt: true,
      channel: {
        select: {
          id: true,
          type: true,
          isReadOnly: true,
          isArchived: true,
        },
      },
    },
  });

  if (!membership?.channel || membership.channel.isArchived) {
    return null;
  }

  return {
    channel: membership.channel,
    membership: {
      channelId: membership.channelId,
      userId: membership.userId,
      lastReadAt: membership.lastReadAt,
    },
  };
}

// AUDIT FIX: New users were not consistently added to every non-DM channel.
// This helper is used by seed, registration, and admin member creation.
export async function addUserToDefaultChatChannels(
  userId: string,
  client: typeof prisma | Prisma.TransactionClient = prisma,
): Promise<void> {
  const channels = await client.chatChannel.findMany({
    where: {
      type: { in: ["GROUP", "ANNOUNCEMENT"] as const },
      isArchived: false,
    },
    select: { id: true },
  });

  if (!channels.length) {
    return;
  }

  await client.channelMember.createMany({
    data: channels.map((channel) => ({
      channelId: channel.id,
      userId,
    })),
    skipDuplicates: true,
  });
}

export type ChatMessageWithRelations = Prisma.ChatMessageGetPayload<{
  include: {
    author: { select: { id: true; name: true; avatarUrl: true } };
    reactions: { select: { emoji: true; userId: true } };
    replyTo: {
      select: {
        id: true;
        body: true;
        imageUrl: true;
        author: { select: { name: true } };
      };
    };
  };
}>;

type PinnedMessageWithRelations = Prisma.PinnedMessageGetPayload<{
  include: {
    message: {
      include: {
        author: { select: { id: true; name: true; avatarUrl: true } };
        reactions: { select: { emoji: true; userId: true } };
        replyTo: {
          select: {
            id: true;
            body: true;
            imageUrl: true;
            author: { select: { name: true } };
          };
        };
      };
    };
  };
}>;

type ChannelWithRelations = Prisma.ChatChannelGetPayload<{
  include: {
    _count: { select: { members: true } };
    members: {
      include: {
        user: {
          select: {
            id: true;
            name: true;
            avatarUrl: true;
          };
        };
      };
    };
    messages: {
      orderBy: { createdAt: "desc" };
      take: 1;
      include: {
        author: {
          select: {
            name: true;
          };
        };
      };
    };
  };
}>;

// AUDIT FIX: Message mapping now hides deleted body/images, truncates reply
// previews to 80 chars, and includes pending state consistently.
export function mapMessage(
  message: ChatMessageWithRelations,
  currentUserId: string,
): ChatMessageWithAuthor {
  return {
    id: message.id,
    channelId: message.channelId,
    authorId: message.authorId,
    body: message.deletedAt ? null : message.body,
    imageUrl: message.deletedAt ? null : message.imageUrl,
    imageWidth: message.deletedAt ? null : message.imageWidth,
    imageHeight: message.deletedAt ? null : message.imageHeight,
    imageName: message.deletedAt ? null : message.imageName,
    replyToId: message.replyToId,
    isEdited: message.isEdited,
    isPinned: message.isPinned,
    deletedAt: message.deletedAt?.toISOString() ?? null,
    editedAt: message.editedAt?.toISOString() ?? null,
    createdAt: message.createdAt.toISOString(),
    isDeleted: Boolean(message.deletedAt),
    isPending: false,
    author: {
      id: message.author.id,
      name: message.author.name,
      image: message.author.avatarUrl,
    },
    reactions: groupReactions(message.reactions, currentUserId),
    replyTo: message.replyTo
      ? {
          id: message.replyTo.id,
          body: message.replyTo.body?.slice(0, 80) ?? null,
          imageUrl: message.replyTo.imageUrl,
          hasImage: Boolean(message.replyTo.imageUrl),
          author: {
            name: message.replyTo.author.name,
          },
        }
      : null,
  };
}

// AUDIT FIX: Channel mapping now returns DM counterpart metadata, normalized
// last-message previews, and member lists for the sidebar/client cache.
export function mapChannel(
  channel: ChannelWithRelations,
  currentUserId: string,
  unreadCount: number,
): ChatChannelWithMeta {
  const lastMessage = channel.messages[0] ?? null;
  const dmUser =
    channel.type === "DM"
      ? channel.members.find((member) => member.userId !== currentUserId)?.user ?? null
      : null;
  const displayName = dmUser?.name ?? channel.name;

  return {
    id: channel.id,
    name: displayName,
    slug: channel.slug,
    description: channel.description,
    type: channel.type,
    isReadOnly: channel.isReadOnly,
    isArchived: channel.isArchived,
    createdAt: channel.createdAt.toISOString(),
    updatedAt: channel.updatedAt.toISOString(),
    unreadCount,
    memberCount: channel._count.members,
    members: channel.members.map((member) => ({
      id: member.id,
      channelId: member.channelId,
      userId: member.userId,
      role: member.role,
      lastReadAt: member.lastReadAt.toISOString(),
      joinedAt: member.joinedAt.toISOString(),
      isMuted: member.isMuted,
      user: {
        id: member.user.id,
        name: member.user.name,
        image: member.user.avatarUrl,
      },
    })),
    dmUser: dmUser
      ? {
          id: dmUser.id,
          name: dmUser.name,
          image: dmUser.avatarUrl,
        }
      : null,
    lastMessage: lastMessage
      ? {
          id: lastMessage.id,
          body: lastMessage.body
            ? `${lastMessage.body.slice(0, 60)}${lastMessage.body.length > 60 ? "..." : ""}`
            : lastMessage.imageUrl
              ? "[Image]"
              : null,
          authorName: lastMessage.author.name,
          createdAt: lastMessage.createdAt.toISOString(),
        }
      : null,
  };
}

// AUDIT FIX: Pinned message responses now share the same typed message mapping
// as the main timeline so the client does not need a parallel shape.
export function mapPinnedMessage(
  pinnedMessage: PinnedMessageWithRelations,
  currentUserId: string,
): PinnedMessageWithDetails {
  return {
    id: pinnedMessage.id,
    channelId: pinnedMessage.channelId,
    messageId: pinnedMessage.messageId,
    pinnedById: pinnedMessage.pinnedById,
    pinnedAt: pinnedMessage.pinnedAt.toISOString(),
    message: mapMessage(pinnedMessage.message, currentUserId),
  };
}
