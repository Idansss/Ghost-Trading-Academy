import { ChannelType, NotificationType } from "@prisma/client";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  type ChatMessageWithRelations,
  getChatChannelName,
  isTrustedUploadthingUrl,
  mapMessage,
  requireChannelAccess,
} from "@/lib/chat";
import { pusherServer } from "@/lib/pusher";
import { prisma } from "@/lib/prisma";
import { sanitizeHtml } from "@/lib/sanitize";
import { sendMessageSchema } from "@/lib/validations/chat";
import {
  isOptionalPrismaSchemaError,
  optionalPrismaQuery,
} from "@/server/core/prisma-schema";
import type { ApiResponse, ChatMessageWithAuthor, MessagesPage } from "@/types/chat";

// AUDIT FIX: All authenticated API routes must opt out of static rendering
export const dynamic = "force-dynamic";

const RATE_WINDOW_MS = 60_000;
const RATE_LIMIT = 30;
const messageRateLimitMap = new Map<string, { count: number; resetAt: number }>();
const EMPTY_MESSAGES_PAGE: MessagesPage = {
  messages: [],
  nextCursor: null,
  hasMore: false,
};

function isMessageRateLimited(userId: string, channelId: string): boolean {
  const key = `${userId}:${channelId}`;
  const now = Date.now();
  const current = messageRateLimitMap.get(key);

  if (!current || current.resetAt <= now) {
    messageRateLimitMap.set(key, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return false;
  }

  if (current.count >= RATE_LIMIT) {
    return true;
  }

  messageRateLimitMap.set(key, { ...current, count: current.count + 1 });
  return false;
}

// AUDIT FIX: Message listing now enforces membership access, proper cursor-based
// pagination, server-side reaction grouping, lightweight reply previews, and a
// fire-and-forget read receipt update.
export async function GET(
  request: Request,
  context: { params: Promise<{ channelId: string }> },
): Promise<NextResponse<ApiResponse<MessagesPage> | { error: string }>> {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { channelId } = await context.params;
    const channel = await optionalPrismaQuery(
      "chat_messages_channel_lookup",
      () =>
        prisma.chatChannel.findUnique({
          where: { id: channelId },
          select: { id: true, isArchived: true },
        }),
      null as { id: string; isArchived: boolean } | null,
    );
    if (!channel || channel.isArchived) {
      return NextResponse.json({ data: EMPTY_MESSAGES_PAGE });
    }

    let access: Awaited<ReturnType<typeof requireChannelAccess>> = null;
    try {
      access = await requireChannelAccess(session.user.id, channelId);
    } catch (error) {
      if (isOptionalPrismaSchemaError(error)) {
        return NextResponse.json({ data: EMPTY_MESSAGES_PAGE });
      }

      throw error;
    }

    if (!access) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get("cursor");
    const parsedLimit = Number.parseInt(searchParams.get("limit") ?? "50", 10);
    const limit =
      Number.isFinite(parsedLimit) && parsedLimit > 0
        ? Math.min(parsedLimit, 100)
        : 50;
    const cursorMessage = cursor
      ? await optionalPrismaQuery(
          "chat_messages_cursor_lookup",
          () =>
            prisma.chatMessage.findUnique({
              where: { id: cursor },
              select: { createdAt: true },
            }),
          null as { createdAt: Date } | null,
        )
      : null;

    const messages = await optionalPrismaQuery(
      "chat_messages_list",
      () =>
        prisma.chatMessage.findMany({
          where: {
            channelId,
            ...(cursorMessage ? { createdAt: { lt: cursorMessage.createdAt } } : {}),
          },
          orderBy: { createdAt: "desc" },
          take: limit + 1,
          include: {
            author: { select: { id: true, name: true, avatarUrl: true } },
            reactions: { select: { emoji: true, userId: true } },
            replyTo: {
              select: {
                id: true,
                body: true,
                imageUrl: true,
                author: { select: { name: true } },
              },
            },
          },
        }),
      [] as ChatMessageWithRelations[],
    );

    const hasMore = messages.length > limit;
    const pageMessages = hasMore ? messages.slice(0, limit) : messages;
    const nextCursor = hasMore ? pageMessages[pageMessages.length - 1]?.id ?? null : null;

    // AUDIT FIX: Read receipts update asynchronously so message loads are not
    // blocked by an extra write on every fetch.
    void prisma.channelMember
      .update({
        where: {
          channelId_userId: {
            channelId,
            userId: session.user.id,
          },
        },
        data: {
          lastReadAt: new Date(),
        },
      })
      .catch(() => undefined);

    return NextResponse.json({
      data: {
        messages: pageMessages.map((message) => mapMessage(message, session.user.id)),
        nextCursor,
        hasMore,
      },
    });
  } catch (error) {
    console.error("[chat/messages GET]", error);
    return NextResponse.json({ error: "Unable to load messages." }, { status: 500 });
  }
}

// AUDIT FIX: Message creation now validates UploadThing image URLs, enforces the
// announcement read-only rule, updates channel activity, sends full realtime
// payloads, and creates notifications only for DMs/@mentions/announcements.
export async function POST(
  request: Request,
  context: { params: Promise<{ channelId: string }> },
): Promise<NextResponse<ApiResponse<ChatMessageWithAuthor> | { error: string }>> {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { channelId } = await context.params;
    const access = await requireChannelAccess(session.user.id, channelId);
    if (!access) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    if (access.channel.isReadOnly && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "This channel is read-only." }, { status: 403 });
    }

    if (isMessageRateLimited(session.user.id, channelId)) {
      return NextResponse.json({ error: "Rate limit exceeded. Please slow down." }, { status: 429 });
    }

    const body = await request.json();
    const parsed = sendMessageSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed.", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    if (parsed.data.imageUrl && !isTrustedUploadthingUrl(parsed.data.imageUrl)) {
      return NextResponse.json({ error: "Image URL must be from UploadThing CDN." }, { status: 400 });
    }

    if (parsed.data.replyToId) {
      const replyTarget = await prisma.chatMessage.findUnique({
        where: { id: parsed.data.replyToId },
        select: { id: true, channelId: true },
      });
      if (!replyTarget || replyTarget.channelId !== channelId) {
        return NextResponse.json({ error: "Reply target not found." }, { status: 400 });
      }
    }

    const cleanBody = parsed.data.body ? sanitizeHtml(parsed.data.body.trim()) : null;
    const createdMessage = await prisma.$transaction(async (transaction) => {
      const message = await transaction.chatMessage.create({
        data: {
          channelId,
          authorId: session.user.id,
          body: cleanBody,
          imageUrl: parsed.data.imageUrl ?? null,
          imageWidth: parsed.data.imageWidth ?? null,
          imageHeight: parsed.data.imageHeight ?? null,
          imageName: parsed.data.imageName ?? null,
          replyToId: parsed.data.replyToId ?? null,
        },
        include: {
          author: { select: { id: true, name: true, avatarUrl: true } },
          reactions: { select: { emoji: true, userId: true } },
          replyTo: {
            select: {
              id: true,
              body: true,
              imageUrl: true,
              author: { select: { name: true } },
            },
          },
        },
      });

      // AUDIT FIX: Channel updatedAt now advances on every new message so the
      // sidebar sorts by actual chat activity instead of stale channel metadata.
      await transaction.chatChannel.update({
        where: { id: channelId },
        data: { updatedAt: new Date() },
      });

      return message;
    });

    const payload = mapMessage(createdMessage, session.user.id);

    if (pusherServer) {
      await pusherServer.trigger(getChatChannelName(channelId), "new-message", payload);
    }

    const channel = await prisma.chatChannel.findUniqueOrThrow({
      where: { id: channelId },
      select: { type: true, slug: true },
    });

    const otherMembers = await prisma.channelMember.findMany({
      where: {
        channelId,
        userId: { not: session.user.id },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (channel.type === ChannelType.DM && otherMembers.length > 0) {
      await prisma.notification.createMany({
        data: otherMembers.map((member) => ({
          userId: member.user.id,
          type: NotificationType.DIRECT_MESSAGE,
          // AUDIT FIX: Restored the broken DM notification template string.
          title: `New message from ${session.user.name}`,
          message: cleanBody?.slice(0, 100) ?? "Sent you an image",
          link: `/community/chat?channel=${channelId}`,
        })),
      });
    }

    const mentionMatches = Array.from((cleanBody ?? "").matchAll(/@([a-zA-Z0-9._-]+)/g));
    const mentionedUsers = otherMembers.filter((member) => {
      const normalizedName = member.user.name.toLowerCase().replace(/\s+/g, "");
      return mentionMatches.some((match) => match[1]?.toLowerCase() === normalizedName);
    });

    if (channel.type !== ChannelType.DM && mentionedUsers.length > 0) {
      await prisma.notification.createMany({
        data: mentionedUsers.map((member) => ({
          userId: member.user.id,
          type: NotificationType.BROADCAST,
          title: `${session.user.name} mentioned you`,
          message: cleanBody?.slice(0, 100) ?? "Mentioned you in chat",
          link: `/community/chat?channel=${channelId}`,
        })),
        skipDuplicates: true,
      });
    }

    if (channel.slug === "announcements" && session.user.role === "ADMIN" && otherMembers.length > 0) {
      await prisma.notification.createMany({
        data: otherMembers.map((member) => ({
          userId: member.user.id,
          type: NotificationType.NEW_ANNOUNCEMENT,
          title: "New announcement",
          message: cleanBody?.slice(0, 100) ?? "New announcement image",
          link: `/community/chat?channel=${channelId}`,
        })),
        skipDuplicates: true,
      });
    }

    return NextResponse.json({ data: payload }, { status: 201 });
  } catch (error) {
    console.error("[chat/messages POST]", error);
    return NextResponse.json({ error: "Unable to send message." }, { status: 500 });
  }
}
