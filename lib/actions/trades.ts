"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { calculateRiskPercent, calculateRR } from "@/lib/calculations";
import { prisma } from "@/lib/prisma";
import { getMonthKey } from "@/lib/utils";
import { tradeSchema } from "@/lib/validators";

const tradePathsToRevalidate = [
  "/dashboard",
  "/journal",
  "/analytics",
  "/community",
  "/profile",
];

async function requireOwnedTrade(tradeId: string) {
  const session = await auth();

  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  const trade = await prisma.trade.findUnique({
    where: { id: tradeId },
  });

  if (!trade || trade.userId !== session.user.id) {
    throw new Error("Forbidden");
  }

  return { session, trade };
}

function revalidateTradePaths() {
  tradePathsToRevalidate.forEach((path) => revalidatePath(path));
}

export async function saveTradeNotesAction(tradeId: string, content: string) {
  await requireOwnedTrade(tradeId);

  const trade = await prisma.trade.update({
    where: { id: tradeId },
    data: {
      notes: content,
    },
  });

  revalidateTradePaths();

  return trade;
}

export async function updateTradeAction(
  tradeId: string,
  payload: z.input<typeof tradeSchema>,
) {
  await requireOwnedTrade(tradeId);

  const parsed = tradeSchema.safeParse(payload);

  if (!parsed.success) {
    throw new Error("Invalid trade payload.");
  }

  const tradeDate = new Date(parsed.data.tradeDate);

  const trade = await prisma.trade.update({
    where: { id: tradeId },
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
      closedAt: parsed.data.outcome === "PENDING" ? null : tradeDate,
    },
  });

  revalidateTradePaths();

  return trade;
}

export async function deleteTradeAction(tradeId: string) {
  await requireOwnedTrade(tradeId);

  await prisma.trade.delete({
    where: { id: tradeId },
  });

  revalidateTradePaths();

  return { ok: true };
}
