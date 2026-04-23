import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getChatChannelName, mapMessage, requireChannelAccess } from "@/lib/chat";
import { pusherServer } from "@/lib/pusher";
import { prisma } from "@/lib/prisma";
import { sanitizeHtml } from "@/lib/sanitize";
import { editMessageSchema } from "@/lib/validations/chat";
import type {
  ApiResponse,
  ChatMessageWithAuthor,
  MessageDeletedEventPayload,
} from "@/types/chat";

// AUDIT FIX: All authenticated API routes must opt out of static rendering.
export const dynamic = "force-dynamic";

// AUDIT FIX: Editing now enforces author/admin permissions, blocks edits to
// deleted messages, returns the full updated message, and emits realtime only
// after the database write succeeds.
export async function PATCH(
  request: Request,
  context: { params: Promise<{ messageId: string }> },
): Promise<NextResponse<ApiResponse<ChatMessageWithAuthor> | { error: string }>> {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { messageId } = await context.params;
    const message = await prisma.chatMessage.findUnique({
      where: { id: messageId },
      include: {
        channel: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!message) {
      return NextResponse.json({ error: "Message not found." }, { status: 404 });
    }

    const access = await requireChannelAccess(session.user.id, message.channelId);
    if (!access) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    if (message.authorId !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    if (message.deletedAt) {
      return NextResponse.json({ error: "Deleted messages cannot be edited." }, { status: 400 });
    }

    const body = await request.json();
    const parsed = editMessageSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed.", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const updatedMessage = await prisma.chatMessage.update({
      where: { id: messageId },
      data: {
        body: sanitizeHtml(parsed.data.body.trim()),
        isEdited: true,
        editedAt: new Date(),
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

    const payload = mapMessage(updatedMessage, session.user.id);

    if (pusherServer) {
      await pusherServer.trigger(getChatChannelName(updatedMessage.channelId), "message-edited", {
        channelId: updatedMessage.channelId,
        message: payload,
      });
    }

    return NextResponse.json({ data: payload });
  } catch (error) {
    console.error("[chat/messages PATCH]", error);
    return NextResponse.json({ error: "Unable to edit message." }, { status: 500 });
  }
}

// AUDIT FIX: Deletion is now a soft delete only, blocks repeat deletes, emits
// channelId with the realtime payload, and keeps the original body in the DB.
export async function DELETE(
  _request: Request,
  context: { params: Promise<{ messageId: string }> },
): Promise<NextResponse<ApiResponse<MessageDeletedEventPayload> | { error: string }>> {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { messageId } = await context.params;
    const message = await prisma.chatMessage.findUnique({
      where: { id: messageId },
      select: {
        id: true,
        channelId: true,
        authorId: true,
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

    if (message.authorId !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    if (message.deletedAt) {
      return NextResponse.json({ error: "Message already deleted." }, { status: 400 });
    }

    await prisma.chatMessage.update({
      where: { id: messageId },
      data: {
        deletedAt: new Date(),
      },
    });

    const payload: MessageDeletedEventPayload = {
      messageId,
      channelId: message.channelId,
    };

    if (pusherServer) {
      await pusherServer.trigger(getChatChannelName(message.channelId), "message-deleted", payload);
    }

    return NextResponse.json({ data: payload });
  } catch (error) {
    console.error("[chat/messages DELETE]", error);
    return NextResponse.json({ error: "Unable to delete message." }, { status: 500 });
  }
}
