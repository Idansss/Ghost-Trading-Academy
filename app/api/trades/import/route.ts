import { Direction, TradeOutcome } from "@prisma/client";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiError, getMonthKey, safeJson } from "@/lib/utils";

// AUDIT FIX: All authenticated API routes must opt out of static rendering
export const dynamic = "force-dynamic";

type ImportTradePayload = {
  coin: string;
  direction: Direction;
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  pnlPercent: number;
  outcome: TradeOutcome;
  setupType: string;
  tags?: string[];
  notes?: string | null;
  tradeDate: string;
};

function isValidTrade(payload: ImportTradePayload) {
  return Boolean(
    payload.coin &&
      payload.direction &&
      Number.isFinite(payload.entryPrice) &&
      Number.isFinite(payload.stopLoss) &&
      Number.isFinite(payload.takeProfit) &&
      payload.tradeDate,
  );
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = await safeJson<unknown>(request);
    const rows = Array.isArray(body) ? (body as ImportTradePayload[]) : [];

    let imported = 0;
    let duplicates = 0;
    let skipped = 0;
    const skippedRows: Array<{ index: number; reason: string }> = [];

    for (let index = 0; index < rows.length; index += 1) {
      const row = rows[index];
      if (!isValidTrade(row)) {
        skipped += 1;
        skippedRows.push({ index, reason: "Missing required fields" });
        continue;
      }

      const tradeDate = new Date(row.tradeDate);
      const lower = new Date(tradeDate.getTime() - 60 * 1000);
      const upper = new Date(tradeDate.getTime() + 60 * 1000);

      const existing = await prisma.trade.findFirst({
        where: {
          userId: user.id,
          coin: row.coin,
          entryPrice: row.entryPrice,
          tradeDate: {
            gte: lower,
            lte: upper,
          },
        },
      });

      if (existing) {
        duplicates += 1;
        continue;
      }

      await prisma.trade.create({
        data: {
          userId: user.id,
          coin: row.coin,
          direction: row.direction,
          entryPrice: row.entryPrice,
          stopLoss: row.stopLoss,
          takeProfit: row.takeProfit,
          rrRatio: 0,
          riskPercent: 0,
          pnlPercent: row.pnlPercent ?? 0,
          outcome: row.outcome ?? "PENDING",
          setupType: row.setupType ?? "Imported",
          tags: row.tags ?? ["Imported"],
          notes: row.notes ?? null,
          tradeDate,
          month: getMonthKey(tradeDate),
          closedAt: row.outcome === "PENDING" ? null : tradeDate,
        },
      });
      imported += 1;
    }

    return Response.json({
      imported,
      duplicatesSkipped: duplicates,
      skippedRowsCount: skipped,
      skippedRows,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return apiError("Unauthorized.", 401);
    }
    return apiError("Unable to import trades.", 500);
  }
}
