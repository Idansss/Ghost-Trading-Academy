import { calculateRR, calculateRiskPercent } from "@/lib/calculations";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiError, getMonthKey, safeJson } from "@/lib/utils";
import { tradeSchema } from "@/lib/validators";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const user = await requireUser();
    const existingTrade = await prisma.trade.findUnique({
      where: { id: params.id },
    });

    if (!existingTrade || existingTrade.userId !== user.id) {
      return apiError("Trade not found.", 404);
    }

    const body = await safeJson<unknown>(request);
    const parsed = tradeSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { message: "Invalid trade payload.", errors: parsed.error.flatten().fieldErrors },
        { status: 422 },
      );
    }

    const tradeDate = new Date(parsed.data.tradeDate);

    const trade = await prisma.trade.update({
      where: { id: params.id },
      data: {
        coin: parsed.data.coin,
        direction: parsed.data.direction,
        entryPrice: parsed.data.entryPrice,
        stopLoss: parsed.data.stopLoss,
        takeProfit: parsed.data.takeProfit,
        tp2: parsed.data.tp2 ?? null,
        tp3: parsed.data.tp3 ?? null,
        rrRatio: calculateRR(
          parsed.data.entryPrice,
          parsed.data.stopLoss,
          parsed.data.takeProfit,
        ),
        riskPercent: calculateRiskPercent(
          parsed.data.entryPrice,
          parsed.data.stopLoss,
        ),
        pnlPercent: parsed.data.pnlPercent,
        outcome: parsed.data.outcome,
        setupType: parsed.data.setupType,
        notes: parsed.data.notes ?? null,
        tradeDate,
        month: getMonthKey(tradeDate),
        closedAt:
          parsed.data.outcome === "PENDING" ? null : tradeDate,
      },
    });

    return Response.json(trade);
  } catch {
    return apiError("Unable to update trade.", 500);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const user = await requireUser();
    const existingTrade = await prisma.trade.findUnique({
      where: { id: params.id },
    });

    if (!existingTrade || existingTrade.userId !== user.id) {
      return apiError("Trade not found.", 404);
    }

    await prisma.trade.delete({ where: { id: params.id } });
    return Response.json({ ok: true });
  } catch {
    return apiError("Unable to delete trade.", 500);
  }
}
