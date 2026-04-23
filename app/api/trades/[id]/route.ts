import { calculateRR, calculateRiskPercent } from "@/lib/calculations";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiError, getMonthKey, safeJson } from "@/lib/utils";
import { tradeSchema } from "@/lib/validators";
import { assertTrustedImageUrl } from "@/lib/sanitize";

// AUDIT FIX: All authenticated API routes must opt out of static rendering
export const dynamic = "force-dynamic";

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
    // AUDIT FIX: Validation error shape changed from { message, errors } to
    // { error, details } for consistency with the global error format.
    if (!parsed.success) {
      return Response.json(
        { error: "Validation failed.", details: parsed.error.flatten() },
        { status: 422 },
      );
    }

    const tradeDate = new Date(parsed.data.tradeDate);
    assertTrustedImageUrl(parsed.data.chartImageUrl || null);

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
        tags: parsed.data.tags,
        notes: parsed.data.notes ?? null,
        chartImageUrl: parsed.data.chartImageUrl || null,
        emotionBefore: parsed.data.emotionBefore ?? null,
        emotionDuring: parsed.data.emotionDuring ?? null,
        emotionAfter: parsed.data.emotionAfter ?? null,
        followedPlan: parsed.data.followedPlan ?? null,
        revenge: parsed.data.revenge ?? false,
        overSized: parsed.data.overSized ?? false,
        movedStop: parsed.data.movedStop ?? false,
        exitedEarly: parsed.data.exitedEarly ?? false,
        tradeRating: parsed.data.tradeRating ?? null,
        mistakeNote: parsed.data.mistakeNote ?? null,
        lessonLearned: parsed.data.lessonLearned ?? null,
        tradeDate,
        month: getMonthKey(tradeDate),
        closedAt:
          parsed.data.outcome === "PENDING" ? null : tradeDate,
      },
    });

    return Response.json(trade);
  } catch (error) {
    console.error(error);
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
  } catch (error) {
    console.error(error);
    return apiError("Unable to delete trade.", 500);
  }
}
