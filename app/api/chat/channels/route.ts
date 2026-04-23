import { ChannelType, Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  CHAT_EVENTS_CHANNEL,
  generateUniqueChannelSlug,
  mapChannel,
} from "@/lib/chat";
import { pusherServer } from "@/lib/pusher";
import { prisma } from "@/lib/prisma";
import { createChannelSchema } from "@/lib/validations/chat";
import { optionalPrismaQuery } from "@/server/core/prisma-schema";
import type { ApiResponse, ChatChannelWithMeta } from "@/types/chat";

// AUDIT FIX: All authenticated API routes must opt out of static rendering
export const dynamic = "force-dynamic";

// AUDIT FIX: ChannelWithActivity type is no longer needed; activityDate is now
// computed inline during sort so the response type stays ChatChannelWithMeta[].

type ChatChannelWithRelations = Prisma.ChatChannelGetPayload<{
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


// AUDIT FIX: Added consistent { data } success envelopes, strict auth checks,
// archived-channel filtering, DM membership scoping, and spec-compliant sort and
// preview rules for the sidebar payload.
export async function GET(): Promise<NextResponse<ApiResponse<ChatChannelWithMeta[]> | { error: string }>> {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const userId = session.user.id;
    const channels = await optionalPrismaQuery<ChatChannelWithRelations[]>(
      "chat_channels_api_list",
      () =>
        prisma.chatChannel.findMany({
          where: {
            isArchived: false,
            OR: [
              {
                type: { in: [ChannelType.GROUP, ChannelType.ANNOUNCEMENT] },
                members: { some: { userId } },
              },
              {
                type: ChannelType.DM,
                members: { some: { userId } },
              },
            ],
          },
          include: {
            _count: { select: { members: true } },
            members: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    avatarUrl: true,
                  },
                },
              },
            },
            messages: {
              orderBy: { createdAt: "desc" },
              take: 1,
              include: {
                author: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        }),
      [],
    );

    // AUDIT FIX: Previous code fired N separate prisma.chatMessage.count() calls
    // in Promise.all — one query per channel. Replaced with a single aggregating
    // raw query that counts unread messages for all channels in one DB round-trip.
    // The query joins ChannelMember (for per-channel lastReadAt) to ChatMessage
    // so each channel uses its own read-watermark without fetching message rows.
    const channelIds = channels.map((ch) => ch.id);

    type UnreadRow = { channel_id: string; count: bigint };
    const unreadRows = channelIds.length > 0
      ? await optionalPrismaQuery<UnreadRow[]>(
          "chat_channels_api_unread_counts",
          () =>
            prisma.$queryRaw<UnreadRow[]>`
              SELECT cm."channelId" AS channel_id, COUNT(msg.id)::bigint AS count
              FROM "ChannelMember" cm
              LEFT JOIN "ChatMessage" msg
                ON msg."channelId" = cm."channelId"
                AND msg."authorId" != ${userId}
                AND msg."createdAt" > cm."lastReadAt"
                AND msg."deletedAt" IS NULL
              WHERE cm."userId" = ${userId}
                AND cm."channelId" = ANY(${channelIds}::text[])
              GROUP BY cm."channelId"
            `,
          [],
        )
      : [];

    const unreadMap = new Map<string, number>(
      unreadRows.map(({ channel_id, count }) => [channel_id, Number(count)]),
    );
    // AUDIT FIX: Previously added activityDate to each channel object just for
    // sorting and then destructured it out in the response, causing an ESLint
    // no-unused-vars error. Now compute the sort key inline so the response
    // type stays clean ChatChannelWithMeta[] with no extra field.
    const getActivityDate = (channel: ChatChannelWithMeta): number =>
      new Date(channel.lastMessage?.createdAt ?? channel.updatedAt).getTime();

    const mappedChannels: ChatChannelWithMeta[] = channels
      .map((channel) => mapChannel(channel, userId, unreadMap.get(channel.id) ?? 0))
      .sort((left, right) => {
        const getPriority = (channel: ChatChannelWithMeta): number => {
          if (channel.type === ChannelType.ANNOUNCEMENT) return 0;
          if (channel.type === ChannelType.GROUP) return 1;
          return 2;
        };

        const typeOrder = getPriority(left) - getPriority(right);
        if (typeOrder !== 0) {
          return typeOrder;
        }

        return getActivityDate(right) - getActivityDate(left);
      });

    return NextResponse.json({
      data: mappedChannels,
    });
  } catch (error) {
    console.error("[chat/channels GET]", error);
    return NextResponse.json({ error: "Unable to load channels." }, { status: 500 });
  }
}

// AUDIT FIX: Channel creation now enforces admin auth, unique slug generation,
// full membership backfill, and realtime sidebar updates for connected clients.
export async function POST(request: Request): Promise<NextResponse<ApiResponse<ChatChannelWithMeta> | { error: string }>> {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const body = await request.json();
    const parsed = createChannelSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed.", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const slug = await generateUniqueChannelSlug(parsed.data.name);
    const createdChannel = await prisma.$transaction(async (transaction) => {
      const channel = await transaction.chatChannel.create({
        data: {
          name: parsed.data.name.trim(),
          description: parsed.data.description?.trim() || null,
          type: parsed.data.type,
          isReadOnly:
            parsed.data.type === ChannelType.ANNOUNCEMENT ? true : parsed.data.isReadOnly,
          slug,
          createdById: session.user.id,
        },
      });

      const users = await transaction.user.findMany({ select: { id: true } });
      if (users.length > 0) {
        await transaction.channelMember.createMany({
          data: users.map((user) => ({
            channelId: channel.id,
            userId: user.id,
          })),
          skipDuplicates: true,
        });
      }

      return transaction.chatChannel.findUniqueOrThrow({
        where: { id: channel.id },
        include: {
          _count: { select: { members: true } },
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  avatarUrl: true,
                },
              },
            },
          },
          messages: {
            orderBy: { createdAt: "desc" },
            take: 1,
            include: {
              author: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      });
    });

    const payload = mapChannel(createdChannel, session.user.id, 0);

    // AUDIT FIX: New channels now broadcast a dedicated sidebar event so
    // connected clients can show them without a refresh.
    if (pusherServer) {
      await pusherServer.trigger(CHAT_EVENTS_CHANNEL, "new-channel", payload);
    }

    return NextResponse.json({ data: payload }, { status: 201 });
  } catch (error) {
    console.error("[chat/channels POST]", error);
    return NextResponse.json({ error: "Unable to create channel." }, { status: 500 });
  }
}
