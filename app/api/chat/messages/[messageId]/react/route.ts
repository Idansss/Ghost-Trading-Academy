import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  getReactionsChannelName,
  groupReactions,
  requireChannelAccess,
} from "@/lib/chat";
import { pusherServer } from "@/lib/pusher";
import { prisma } from "@/lib/prisma";
import { reactionSchema } from "@/lib/validations/chat";
import type { ApiResponse, ReactionUpdatedEventPayload } from "@/types/chat";

// AUDIT FIX: All authenticated API routes must opt out of static rendering
export const dynamic = "force-dynamic";

// AUDIT FIX: Reaction toggles now validate against the allowlist, run inside a
// transaction to prevent duplicates under concurrency, block deleted-message
// reactions, and broadcast the full grouped reaction summary.
export async function POST(
  request: Request,
  context: { params: Promise<{ messageId: string }> },
): Promise<NextResponse<ApiResponse<ReactionUpdatedEventPayload> | { error: string }>> {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { messageId } = await context.params;
    const body = await request.json();
    const parsed = reactionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed.", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const message = await prisma.chatMessage.findUnique({
      where: { id: messageId },
      select: {
        id: true,
        channelId: true,
        deletedAt: true,
      },
    });

    if (!message) {
      return NextResponse.json({ error: "Message not found." }, { status: 404 });
    }

    const access = await requireChannelAccess(session.user.id, message.channelId);
    if (!access) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    if (message.deletedAt) {
      return NextResponse.json({ error: "Cannot react to a deleted message." }, { status: 400 });
    }

    await prisma.$transaction(async (transaction) => {
      const existingReaction = await transaction.messageReaction.findUnique({
        where: {
          messageId_userId_emoji: {
            messageId,
            userId: session.user.id,
            emoji: parsed.data.emoji,
          },
        },
      });

      if (existingReaction) {
        await transaction.messageReaction.delete({
          where: {
            id: existingReaction.id,
          },
        });
        return;
      }

      await transaction.messageReaction.create({
        data: {
          messageId,
          userId: session.user.id,
          emoji: parsed.data.emoji,
        },
      });
    });

    const updatedReactions = await prisma.messageReaction.findMany({
      where: { messageId },
      select: { emoji: true, userId: true },
    });

    const payload: ReactionUpdatedEventPayload = {
      messageId,
      channelId: message.channelId,
      reactions: groupReactions(updatedReactions, session.user.id),
    };

    if (pusherServer) {
      await pusherServer.trigger(getReactionsChannelName(message.channelId), "reaction-updated", payload);
    }

    return NextResponse.json({ data: payload });
  } catch (error) {
    console.error("[chat/react POST]", error);
    return NextResponse.json({ error: "Unable to toggle reaction." }, { status: 500 });
  }
}
