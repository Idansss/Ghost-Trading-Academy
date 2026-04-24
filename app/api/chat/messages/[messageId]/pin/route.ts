import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getChatChannelName, requireChannelAccess } from "@/lib/chat";
import { broadcastRealtimeEvent } from "@/lib/realtime";
import { prisma } from "@/lib/prisma";
import type { ApiResponse, MessagePinnedEventPayload } from "@/types/chat";

// AUDIT FIX: All authenticated API routes must opt out of static rendering
export const dynamic = "force-dynamic";

// AUDIT FIX: Pin toggles now require admin auth, run atomically in a
// transaction, maintain the PinnedMessage join table, and emit channelId so the
// client can update the correct cache immediately.
export async function PATCH(
  _request: Request,
  context: { params: Promise<{ messageId: string }> },
): Promise<NextResponse<ApiResponse<MessagePinnedEventPayload> | { error: string }>> {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const { messageId } = await context.params;
    const message = await prisma.chatMessage.findUnique({
      where: { id: messageId },
      select: {
        id: true,
        channelId: true,
      },
    });

    if (!message) {
      return NextResponse.json({ error: "Message not found." }, { status: 404 });
    }

    const access = await requireChannelAccess(session.user.id, message.channelId);
    if (!access) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const payload = await prisma.$transaction(async (transaction) => {
      const existingPin = await transaction.pinnedMessage.findUnique({
        where: { messageId },
      });
      const isPinned = !existingPin;

      await transaction.chatMessage.update({
        where: { id: messageId },
        data: { isPinned },
      });

      if (existingPin) {
        await transaction.pinnedMessage.delete({
          where: { id: existingPin.id },
        });
      } else {
        await transaction.pinnedMessage.create({
          data: {
            channelId: message.channelId,
            messageId,
            pinnedById: session.user.id,
          },
        });
      }

      const eventPayload: MessagePinnedEventPayload = {
        messageId,
        channelId: message.channelId,
        isPinned,
      };

      return eventPayload;
    });

    try {
      await broadcastRealtimeEvent(getChatChannelName(message.channelId), "message-pinned", payload);
    } catch (realtimeError) {
      console.error("[chat/pin PATCH] Realtime broadcast failed", realtimeError);
    }

    return NextResponse.json({ data: payload });
  } catch (error) {
    console.error("[chat/pin PATCH]", error);
    return NextResponse.json({ error: "Unable to toggle pin." }, { status: 500 });
  }
}
