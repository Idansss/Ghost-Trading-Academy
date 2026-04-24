import { requireAdmin, requireUser } from "@/lib/auth";
import { sendNotification } from "@/lib/notify";
import { prisma } from "@/lib/prisma";
import { sanitizeHtml } from "@/lib/sanitize";
import { logAdminAction } from "@/lib/audit-log";
import { apiError, safeJson } from "@/lib/utils";

// AUDIT FIX: All authenticated API routes must opt out of static rendering
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireUser();
    const announcements = await prisma.announcement.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
    });
    return Response.json({ announcements });
  } catch (error) {
    console.error(error);
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
        message: sanitizeHtml(String(body.message ?? "")),
        type: (body.type as never) ?? "INFO",
        isUrgent: Boolean(body.isUrgent),
        postedBy: user.id,
      },
    });

    const recipients = await prisma.user.findMany({
      where: { role: "PREMIUM" },
      select: { id: true },
    });

    await Promise.all(
      recipients.map((recipient) =>
        sendNotification(
          recipient.id,
          "NEW_ANNOUNCEMENT",
          {
            title: announcement.title,
            message: announcement.message,
            link: "/community",
          },
        ),
      ),
    );
    await logAdminAction({
      userId: user.id,
      action: "ANNOUNCEMENT_POSTED",
      entity: "Announcement",
      entityId: announcement.id,
    });

    return Response.json(announcement);
  } catch (error) {
    console.error(error);
    return apiError("Unable to save announcement.", 500);
  }
}
