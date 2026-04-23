import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiError, safeJson } from "@/lib/utils";
import { weeklyRecapSchema } from "@/lib/validators";

// AUDIT FIX: All authenticated API routes must opt out of static rendering
export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    await requireAdmin();
    const body = await safeJson<Record<string, unknown>>(request);
    const existingRecap = await prisma.weeklyRecap.findUnique({
      where: { id: params.id },
    });

    if (!existingRecap) {
      return apiError("Recap not found.", 404);
    }

    const parsed = weeklyRecapSchema.safeParse({
      weekStartDate:
        body.weekStartDate ?? existingRecap.weekStartDate.toISOString().slice(0, 10),
      weekEndDate:
        body.weekEndDate ?? existingRecap.weekEndDate.toISOString().slice(0, 10),
      totalTrades: body.totalTrades ?? existingRecap.totalTrades,
      wins: body.wins ?? existingRecap.wins,
      losses: body.losses ?? existingRecap.losses,
      winRate: body.winRate ?? existingRecap.winRate,
      bestTrade: body.bestTrade ?? existingRecap.bestTrade,
      worstTrade: body.worstTrade ?? existingRecap.worstTrade,
      totalPnlPercent: body.totalPnlPercent ?? existingRecap.totalPnlPercent,
      whatWeLearned: body.whatWeLearned ?? existingRecap.whatWeLearned,
      nextWeekFocus: body.nextWeekFocus ?? existingRecap.nextWeekFocus,
    });

    // AUDIT FIX: Validation error shape changed from { message, errors } to
    // { error, details } for consistency with the global error format.
    if (!parsed.success) {
      return Response.json(
        { error: "Validation failed.", details: parsed.error.flatten() },
        { status: 422 },
      );
    }

    const recap = await prisma.weeklyRecap.update({
      where: { id: params.id },
      data: {
        ...parsed.data,
        weekStartDate: new Date(parsed.data.weekStartDate),
        weekEndDate: new Date(parsed.data.weekEndDate),
      },
    });
    return Response.json(recap);
  } catch (error) {
    console.error(error);
    return apiError("Unable to update recap.", 500);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } },
) {
  try {
    await requireAdmin();
    await prisma.weeklyRecap.delete({ where: { id: params.id } });
    return Response.json({ ok: true });
  } catch (error) {
    console.error(error);
    return apiError("Unable to delete recap.", 500);
  }
}
