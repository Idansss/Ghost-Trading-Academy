import { requireAdmin, requireUser } from "@/lib/auth";
import { createNotification } from "@/lib/actions/notifications";
import { prisma } from "@/lib/prisma";
import { apiError, safeJson } from "@/lib/utils";
import { weeklyRecapSchema } from "@/lib/validators";

export async function GET() {
  try {
    await requireUser();
    const recaps = await prisma.weeklyRecap.findMany({
      orderBy: { createdAt: "desc" },
    });
    return Response.json({ recaps });
  } catch {
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
        { message: "Invalid recap payload.", errors: parsed.error.flatten().fieldErrors },
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
      where: { role: "VIP" },
      select: { id: true },
    });

    await Promise.all(
      recipients.map((recipient) =>
        createNotification(
          recipient.id,
          "WEEKLY_RECAP",
          "Weekly recap posted",
          `Week of ${new Date(recap.weekStartDate).toLocaleDateString()}: ${recap.totalTrades} trades, ${recap.winRate}% win rate`,
          "/community",
        ),
      ),
    );

    await prisma.announcement.create({
      data: {
        title: "Weekly recap posted",
        message: recap.nextWeekFocus,
        type: "INFO",
        postedBy: user.id,
      },
    });

    return Response.json(recap);
  } catch {
    return apiError("Unable to save weekly recap.", 500);
  }
}
