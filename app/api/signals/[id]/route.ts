import { requireAdmin } from "@/lib/auth";
import { createNotification } from "@/lib/actions/notifications";
import { prisma } from "@/lib/prisma";
import { apiError, safeJson } from "@/lib/utils";
import { signalSchema } from "@/lib/validators";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    await requireAdmin();
    const body = await safeJson<Record<string, unknown>>(request);
    const existingSignal = await prisma.signal.findUnique({
      where: { id: params.id },
    });

    if (!existingSignal) {
      return apiError("Signal not found.", 404);
    }

    const parsed = signalSchema.safeParse({
      coin: body.coin ?? existingSignal.coin,
      direction: body.direction ?? existingSignal.direction,
      entryZone: body.entryZone ?? existingSignal.entryZone,
      stopLoss: body.stopLoss ?? existingSignal.stopLoss,
      tp1: body.tp1 ?? existingSignal.tp1,
      tp2: body.tp2 ?? existingSignal.tp2,
      tp3: body.tp3 ?? existingSignal.tp3,
      riskLevel: body.riskLevel ?? existingSignal.riskLevel,
      timeframe: body.timeframe ?? existingSignal.timeframe,
      rrRatio: body.rrRatio ?? existingSignal.rrRatio,
      reasoning: body.reasoning ?? existingSignal.reasoning,
      status: body.status ?? existingSignal.status,
      isVipOnly: body.isVipOnly ?? existingSignal.isVipOnly,
    });

    if (!parsed.success) {
      return Response.json(
        { message: "Invalid signal payload.", errors: parsed.error.flatten().fieldErrors },
        { status: 422 },
      );
    }

    const signal = await prisma.signal.update({
      where: { id: params.id },
      data: {
        ...parsed.data,
        closedAt: ["WIN", "LOSS", "CANCELLED", "BREAKEVEN"].includes(parsed.data.status)
          ? new Date()
          : null,
      },
    });

    if (parsed.data.status !== existingSignal.status) {
      const recipients = await prisma.user.findMany({
        where: { role: "VIP" },
        select: { id: true },
      });

      if (parsed.data.status === "WIN") {
        await Promise.all(
          recipients.map((recipient) =>
            createNotification(
              recipient.id,
              "TP_HIT",
              `Signal closed: ${signal.coin} WIN`,
              `The ${signal.coin} ${signal.direction} signal hit target.`,
              "/signals",
            ),
          ),
        );
      }

      if (parsed.data.status === "LOSS") {
        await Promise.all(
          recipients.map((recipient) =>
            createNotification(
              recipient.id,
              "SL_HIT",
              `Signal closed: ${signal.coin} LOSS`,
              `The ${signal.coin} signal hit stop loss.`,
              "/signals",
            ),
          ),
        );
      }

      if (parsed.data.status === "BREAKEVEN") {
        await Promise.all(
          recipients.map((recipient) =>
            createNotification(
              recipient.id,
              "BREAKEVEN",
              `Signal closed: ${signal.coin} breakeven`,
              `The ${signal.coin} ${signal.direction} signal closed at breakeven.`,
              "/signals",
            ),
          ),
        );
      }
    }

    return Response.json(signal);
  } catch {
    return apiError("Unable to update signal.", 500);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } },
) {
  try {
    await requireAdmin();
    await prisma.signal.delete({ where: { id: params.id } });
    return Response.json({ ok: true });
  } catch {
    return apiError("Unable to delete signal.", 500);
  }
}
