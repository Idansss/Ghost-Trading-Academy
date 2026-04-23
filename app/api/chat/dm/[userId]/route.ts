import { ChannelType } from "@prisma/client";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { mapChannel } from "@/lib/chat";
import { prisma } from "@/lib/prisma";
import type { ApiResponse, ChatChannelWithMeta } from "@/types/chat";

// AUDIT FIX: All authenticated API routes must opt out of static rendering
export const dynamic = "force-dynamic";

// AUDIT FIX: DM creation now blocks self-DMs, reuses existing two-member DM
// channels via the correct AND/some query, and creates the channel plus both
// memberships atomically with a deterministic slug.
export async function POST(
  _request: Request,
  context: { params: Promise<{ userId: string }> },
): Promise<NextResponse<ApiResponse<ChatChannelWithMeta> | { error: string }>> {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { userId } = await context.params;
    if (userId === session.user.id) {
      return NextResponse.json({ error: "Cannot DM yourself." }, { status: 400 });
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });
    if (!targetUser) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    const existingChannel = await prisma.chatChannel.findFirst({
      where: {
        type: ChannelType.DM,
        AND: [
          { members: { some: { userId: session.user.id } } },
          { members: { some: { userId } } },
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
    });

    if (existingChannel) {
      return NextResponse.json({
        data: mapChannel(existingChannel, session.user.id, 0),
      });
    }

    const sortedUserIds = [session.user.id, userId].sort();
    const channel = await prisma.$transaction(async (transaction) => {
      const createdChannel = await transaction.chatChannel.create({
        data: {
          type: ChannelType.DM,
          name: sortedUserIds.join(" / "),
          slug: `dm-${sortedUserIds.join("-")}`,
          createdById: session.user.id,
        },
      });

      await transaction.channelMember.createMany({
        data: sortedUserIds.map((memberId) => ({
          channelId: createdChannel.id,
          userId: memberId,
        })),
        skipDuplicates: true,
      });

      return transaction.chatChannel.findUniqueOrThrow({
        where: { id: createdChannel.id },
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

    return NextResponse.json({
      data: mapChannel(channel, session.user.id, 0),
    });
  } catch (error) {
    console.error("[chat/dm POST]", error);
    return NextResponse.json({ error: "Unable to start DM." }, { status: 500 });
  }
}
