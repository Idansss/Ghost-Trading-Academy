import { requireUser } from "@/lib/auth";
import {
  getNotifications,
  getUnreadCount,
  markAllAsRead,
  markAsRead,
} from "@/lib/actions/notifications";
import { prisma } from "@/lib/prisma";
import { apiError, safeJson } from "@/lib/utils";

// AUDIT FIX: All authenticated API routes must opt out of static rendering
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const user = await requireUser();
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get("mode");

    if (mode === "count") {
      const unreadCount = await getUnreadCount(user.id);
      const dmMemberships = await prisma.channelMember.findMany({
        where: { userId: user.id, channel: { type: "DM" } },
        select: { channelId: true, lastReadAt: true },
      });
      const unreadDmCounts = await Promise.all(
        dmMemberships.map((membership) =>
          prisma.chatMessage.count({
            where: {
              channelId: membership.channelId,
              authorId: { not: user.id },
              createdAt: { gt: membership.lastReadAt },
              deletedAt: null,
            },
          }),
        ),
      );
      const unreadDmCount = unreadDmCounts.reduce((sum, value) => sum + value, 0);
      return Response.json({ unreadCount: unreadCount + unreadDmCount });
    }

    const page = Number(searchParams.get("page") ?? "1");
    const filter =
      (searchParams.get("filter") as
        | "ALL"
        | "UNREAD"
        | "SIGNALS"
        | "RESOURCES"
        | "RECAPS"
        | null) ?? "ALL";

    const [notificationResult, unreadCount] = await Promise.all([
      getNotifications(user.id, { page, filter }),
      getUnreadCount(user.id),
    ]);

    return Response.json({
      ...notificationResult,
      unreadCount,
    });
  } catch (error) {
    console.error(error);
    return apiError("Unable to load notifications.", 500);
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await requireUser();
    const body = await safeJson<{
      markAllRead?: boolean;
      notificationId?: string;
    }>(request);
    if (body.markAllRead) {
      await markAllAsRead(user.id);
    }

    if (body.notificationId) {
      const notification = await prisma.notification.findUnique({
        where: { id: body.notificationId },
      });

      if (!notification || notification.userId !== user.id) {
        return apiError("Notification not found.", 404);
      }

      await markAsRead(body.notificationId);
    }

    return Response.json({ ok: true });
  } catch (error) {
    console.error(error);
    return apiError("Unable to update notifications.", 500);
  }
}
