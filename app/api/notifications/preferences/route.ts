import { NotificationType } from "@prisma/client";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiError, safeJson } from "@/lib/utils";

// AUDIT FIX: All authenticated API routes must opt out of static rendering
export const dynamic = "force-dynamic";

const notificationTypes: NotificationType[] = [
  "NEW_SIGNAL",
  "SIGNAL_UPDATE",
  "NEW_ANNOUNCEMENT",
  "NEW_RECAP",
  "WIN_APPROVED",
  "STREAK_REMINDER",
  "WEEKLY_REVIEW_READY",
  "LEADERBOARD_UPDATE",
  "NEW_RESOURCE",
  "BROADCAST",
];

export async function GET() {
  try {
    const user = await requireUser();
    const existing = await prisma.notificationPreference.findMany({
      where: { userId: user.id },
    });
    const map = new Map(existing.map((item) => [item.type, item]));
    const preferences = notificationTypes.map((type) => ({
      type,
      inApp: map.get(type)?.inApp ?? true,
      email: map.get(type)?.email ?? false,
      push: map.get(type)?.push ?? false,
    }));
    return Response.json({ preferences });
  } catch (error) {
    console.error(error);
    return apiError("Unable to load notification preferences.", 500);
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await requireUser();
    const body = await safeJson<{
      type: NotificationType;
      inApp: boolean;
      email: boolean;
      push: boolean;
    }>(request);
    const preference = await prisma.notificationPreference.upsert({
      where: {
        userId_type: {
          userId: user.id,
          type: body.type,
        },
      },
      create: {
        userId: user.id,
        type: body.type,
        inApp: body.inApp,
        email: body.email,
        push: body.push,
      },
      update: {
        inApp: body.inApp,
        email: body.email,
        push: body.push,
      },
    });
    return Response.json(preference);
  } catch (error) {
    console.error(error);
    return apiError("Unable to update notification preferences.", 500);
  }
}
