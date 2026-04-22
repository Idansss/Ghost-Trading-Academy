import { requireAdmin, requireUser } from "@/lib/auth";
import { createNotification } from "@/lib/actions/notifications";
import { prisma } from "@/lib/prisma";
import { apiError, safeJson } from "@/lib/utils";
import { signalSchema } from "@/lib/validators";

export async function GET(request: Request) {
  try {
    const user = await requireUser();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const [signals, takenRecords] = await Promise.all([
      prisma.signal.findMany({
        where: status && status !== "ALL" ? { status: status as never } : undefined,
        orderBy: { postedAt: "desc" },
      }),
      prisma.signalTaken.findMany({
        where: { userId: user.id },
        select: { signalId: true },
      }),
    ]);

    const takenSet = new Set(takenRecords.map((r) => r.signalId));
    const signalsWithTaken = signals.map((signal) => ({
      ...signal,
      takenByMe: takenSet.has(signal.id),
    }));

    return Response.json({ signals: signalsWithTaken });
  } catch {
    return apiError("Unable to load signals.", 500);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAdmin();
    const body = await safeJson<unknown>(request);
    const parsed = signalSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { message: "Invalid signal payload.", errors: parsed.error.flatten().fieldErrors },
        { status: 422 },
      );
    }

    const signal = await prisma.signal.create({
      data: {
        ...parsed.data,
        postedBy: user.id,
      },
    });

    const recipients = await prisma.user.findMany({
      where: {
        role: "VIP",
      },
      select: { id: true },
    });

    await prisma.announcement.create({
      data: {
        title: `${signal.coin} ${signal.direction} signal`,
        message: signal.reasoning,
        type: "SIGNAL_UPDATE",
        postedBy: user.id,
      },
    });

    await Promise.all(
      recipients.map((recipient) =>
        createNotification(
          recipient.id,
          "NEW_SIGNAL",
          `New signal: ${signal.coin}`,
          `${signal.direction} ${signal.coin} | Entry: ${signal.entryZone} | R:R: ${signal.rrRatio}R`,
          "/signals",
        ),
      ),
    );

    return Response.json(signal);
  } catch {
    return apiError("Unable to save signal.", 500);
  }
}
