import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { mapPinnedMessage, requireChannelAccess } from "@/lib/chat";
import { prisma } from "@/lib/prisma";
import type { ApiResponse, PinnedMessageWithDetails } from "@/types/chat";

// AUDIT FIX: All authenticated API routes must opt out of static rendering
export const dynamic = "force-dynamic";

// AUDIT FIX: Pinned message reads now require channel membership and return the
// same normalized message payload shape as the main timeline.
export async function GET(
  _request: Request,
  context: { params: Promise<{ channelId: string }> },
): Promise<NextResponse<ApiResponse<PinnedMessageWithDetails[]> | { error: string }>> {
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

    const pinnedMessages = await prisma.pinnedMessage.findMany({
      where: { channelId },
      orderBy: { pinnedAt: "desc" },
      include: {
        message: {
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
        },
      },
    });

    return NextResponse.json({
      data: pinnedMessages.map((pinnedMessage) => mapPinnedMessage(pinnedMessage, session.user.id)),
    });
  } catch (error) {
    console.error("[chat/pinned GET]", error);
    return NextResponse.json({ error: "Unable to load pinned messages." }, { status: 500 });
  }
}
