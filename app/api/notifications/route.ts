import { z } from "zod";
import {
  getNotifications,
  getUnreadCount,
  markAllAsRead,
  markAsRead,
} from "@/lib/actions/notifications";
import { prisma } from "@/lib/prisma";
import { requireAuthenticatedUser } from "@/server/core/auth";
import { AppError } from "@/server/core/app-error";
import { success } from "@/server/core/http";
import { createRouteHandler } from "@/server/core/route";
import { parseJsonBody, parseSearchParams } from "@/server/core/validation";
import { optionalPrismaQuery } from "@/server/core/prisma-schema";

export const dynamic = "force-dynamic";

const notificationQuerySchema = z.object({
  mode: z.string().optional(),
  page: z.coerce.number().int().positive().optional(),
  filter: z
    .enum(["ALL", "UNREAD", "SIGNALS", "RESOURCES", "RECAPS"])
    .optional(),
});

const notificationPatchSchema = z.object({
  markAllRead: z.boolean().optional(),
  notificationId: z.string().optional(),
});

export const GET = createRouteHandler(async ({ request }) => {
  const user = await requireAuthenticatedUser();
  const query = parseSearchParams(request, notificationQuerySchema);

  if (query.mode === "count") {
    const unreadCount = await optionalPrismaQuery(
      "notifications_unread_count",
      () => getUnreadCount(user.id),
      0,
    );

    const dmMemberships = await optionalPrismaQuery(
      "notifications_dm_memberships",
      () =>
        prisma.channelMember.findMany({
          where: { userId: user.id, channel: { type: "DM" } },
          select: { channelId: true, lastReadAt: true },
        }),
      [] as Array<{ channelId: string; lastReadAt: Date }>,
    );

    const unreadDmCounts = dmMemberships.length
      ? await optionalPrismaQuery(
          "notifications_unread_dm_counts",
          () =>
            Promise.all(
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
            ),
          [],
        )
      : [];

    const unreadDmCount = unreadDmCounts.reduce((sum, value) => sum + value, 0);
    return success({ unreadCount: unreadCount + unreadDmCount });
  }

  const page = query.page ?? 1;
  const filter = query.filter ?? "ALL";

  const [notificationResult, unreadCount] = await Promise.all([
    optionalPrismaQuery(
      "notifications_list",
      () => getNotifications(user.id, { page, filter }),
      { notifications: [], total: 0, page, totalPages: 1 },
    ),
    optionalPrismaQuery(
      "notifications_page_unread_count",
      () => getUnreadCount(user.id),
      0,
    ),
  ]);

  return success({ ...notificationResult, unreadCount });
});

export const PATCH = createRouteHandler(async ({ request }) => {
  const user = await requireAuthenticatedUser();
  const body = await parseJsonBody(request, notificationPatchSchema);

  if (body.markAllRead) {
    await markAllAsRead(user.id);
  }

  if (body.notificationId) {
    const notification = await prisma.notification.findUnique({
      where: { id: body.notificationId },
    });

    if (!notification || notification.userId !== user.id) {
      throw AppError.notFound("Notification not found.");
    }

    await markAsRead(body.notificationId);
  }

  return success({ ok: true });
});
