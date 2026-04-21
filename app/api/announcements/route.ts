import { requireAdmin, requireUser } from "@/lib/auth";
import { createNotification } from "@/lib/actions/notifications";
import { prisma } from "@/lib/prisma";
import { apiError, safeJson } from "@/lib/utils";

export async function GET() {
  try {
    await requireUser();
    const announcements = await prisma.announcement.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
    });
    return Response.json({ announcements });
  } catch {
    return apiError("Unable to load announcements.", 500);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAdmin();
    const body = await safeJson<Record<string, unknown>>(request);
    const announcement = await prisma.announcement.create({
      data: {
        title: String(body.title ?? ""),
        message: String(body.message ?? ""),
        type: (body.type as never) ?? "INFO",
        isUrgent: Boolean(body.isUrgent),
        postedBy: user.id,
      },
    });

    const recipients = await prisma.user.findMany({
      where: { role: "VIP" },
      select: { id: true },
    });

    await Promise.all(
      recipients.map((recipient) =>
        createNotification(
          recipient.id,
          "ANNOUNCEMENT",
          announcement.title,
          announcement.message,
          "/community",
        ),
      ),
    );

    return Response.json(announcement);
  } catch {
    return apiError("Unable to save announcement.", 500);
  }
}
