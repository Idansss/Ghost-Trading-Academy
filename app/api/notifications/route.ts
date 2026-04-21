import { requireUser } from "@/lib/auth";
import {
  getNotifications,
  getUnreadCount,
  markAllAsRead,
  markAsRead,
} from "@/lib/actions/notifications";
import { prisma } from "@/lib/prisma";
import { apiError, safeJson } from "@/lib/utils";

export async function GET(request: Request) {
  try {
    const user = await requireUser();
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get("mode");

    if (mode === "count") {
      const unreadCount = await getUnreadCount(user.id);
      return Response.json({ unreadCount });
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
  } catch {
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
  } catch {
    return apiError("Unable to update notifications.", 500);
  }
}
