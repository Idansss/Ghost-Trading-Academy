import { NotificationType } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function sendNotification(
  userId: string,
  type: NotificationType,
  data: {
    title: string;
    message: string;
    link?: string;
  },
) {
  const preference = await prisma.notificationPreference.findUnique({
    where: {
      userId_type: {
        userId,
        type,
      },
    },
  });

  const allowInApp = preference?.inApp ?? true;
  if (allowInApp) {
    await prisma.notification.create({
      data: {
        userId,
        type,
        title: data.title,
        message: data.message,
        link: data.link,
      },
    });
  }

  // Placeholder for email/push dispatchers once channel adapters are plugged in.
  return { inAppSent: allowInApp, emailSent: false, pushSent: false };
}
