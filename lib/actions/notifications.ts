"use server";

import { NotificationType } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function requireNotificationSession() {
  const session = await auth();

  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  return session.user;
}

async function assertNotificationAccess(userId: string) {
  const user = await requireNotificationSession();

  if (user.role !== "ADMIN" && user.id !== userId) {
    throw new Error("Forbidden");
  }

  return user;
}

export async function getNotifications(
  userId: string,
  options?: {
    page?: number;
    limit?: number;
    filter?: "ALL" | "UNREAD" | "SIGNALS" | "RESOURCES" | "RECAPS";
  },
) {
  await assertNotificationAccess(userId);

  const page = options?.page ?? 1;
  const limit = options?.limit ?? 20;
  const filter = options?.filter ?? "ALL";

  const typeFilter =
    filter === "SIGNALS"
      ? {
          type: {
            in: [
              NotificationType.NEW_SIGNAL,
              NotificationType.TP_HIT,
              NotificationType.SL_HIT,
              NotificationType.BREAKEVEN,
            ],
          },
        }
      : filter === "RESOURCES"
        ? { type: NotificationType.NEW_RESOURCE }
        : filter === "RECAPS"
          ? { type: NotificationType.WEEKLY_RECAP }
          : {};

  const where = {
    userId,
    ...(filter === "UNREAD" ? { isRead: false } : {}),
    ...typeFilter,
  };

  const [notifications, total] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.notification.count({ where }),
  ]);

  return {
    notifications,
    total,
    page,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}

export async function getUnreadCount(userId: string) {
  await assertNotificationAccess(userId);

  return prisma.notification.count({
    where: {
      userId,
      isRead: false,
    },
  });
}

export async function markAsRead(notificationId: string) {
  const user = await requireNotificationSession();
  const existingNotification = await prisma.notification.findUnique({
    where: { id: notificationId },
  });

  if (!existingNotification || existingNotification.userId !== user.id) {
    throw new Error("Forbidden");
  }

  return prisma.notification.update({
    where: { id: notificationId },
    data: { isRead: true },
  });
}

export async function markAllAsRead(userId: string) {
  await assertNotificationAccess(userId);

  return prisma.notification.updateMany({
    where: {
      userId,
      isRead: false,
    },
    data: {
      isRead: true,
    },
  });
}

export async function createNotification(
  userId: string,
  type: NotificationType,
  title: string,
  message: string,
  link?: string,
) {
  await assertNotificationAccess(userId);

  return prisma.notification.create({
    data: {
      userId,
      type,
      title,
      message,
      link,
    },
  });
}
