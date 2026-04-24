import { requireAdmin, requireUser } from "@/lib/auth";
import { sendNotification } from "@/lib/notify";
import { prisma } from "@/lib/prisma";
import { sanitizeHtml } from "@/lib/sanitize";
import { apiError, safeJson } from "@/lib/utils";
import { weeklyRecapSchema } from "@/lib/validators";
import { logAdminAction } from "@/lib/audit-log";

// AUDIT FIX: All authenticated API routes must opt out of static rendering
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireUser();
    const recaps = await prisma.weeklyRecap.findMany({
      orderBy: { createdAt: "desc" },
    });
    return Response.json({ recaps });
  } catch (error) {
    console.error(error);
    return apiError("Unable to load weekly recaps.", 500);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAdmin();
    const body = await safeJson<unknown>(request);
    const parsed = weeklyRecapSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { error: "Validation failed.", details: parsed.error.flatten() },
        { status: 422 },
      );
    }

    const recap = await prisma.weeklyRecap.create({
      data: {
        ...parsed.data,
        weekStartDate: new Date(parsed.data.weekStartDate),
        weekEndDate: new Date(parsed.data.weekEndDate),
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
          "NEW_RECAP",
          {
            title: "Weekly recap posted",
            message: `Week of ${new Date(recap.weekStartDate).toLocaleDateString()}: ${recap.totalTrades} trades, ${recap.winRate}% win rate`,
            link: "/community",
          },
        ),
      ),
    );

    await prisma.announcement.create({
      data: {
        title: "Weekly recap posted",
        message: sanitizeHtml(recap.nextWeekFocus),
        type: "INFO",
        postedBy: user.id,
      },
    });
    await logAdminAction({
      userId: user.id,
      action: "RECAP_PUBLISHED",
      entity: "WeeklyRecap",
      entityId: recap.id,
    });

    return Response.json(recap);
  } catch (error) {
    console.error(error);
    return apiError("Unable to save weekly recap.", 500);
  }
}
