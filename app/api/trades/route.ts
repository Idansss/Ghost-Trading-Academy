import { Direction, TradeOutcome } from "@prisma/client";
import { calculateAvgRR, calculateDailyLoss, calculateMonthlyPnL, calculateWinRate, calculateRR, calculateRiskPercent, getMonthlySnapshot } from "@/lib/calculations";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiError, getMonthKey, safeJson } from "@/lib/utils";
import { tradeSchema } from "@/lib/validators";

export async function GET(request: Request) {
  try {
    const user = await requireUser();
    const { searchParams } = new URL(request.url);

    const month = searchParams.get("month");
    const search = searchParams.get("search");
    const outcome = searchParams.get("outcome");
    const direction = searchParams.get("direction");
    const setup = searchParams.get("setup");
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const where = {
      userId: user.id,
      ...(month ? { month } : {}),
      ...(search ? { coin: { contains: search, mode: "insensitive" as const } } : {}),
      ...(outcome && outcome !== "ALL"
        ? { outcome: outcome as TradeOutcome }
        : {}),
      ...(direction && direction !== "ALL"
        ? { direction: direction as Direction }
        : {}),
      ...(setup ? { setupType: { contains: setup, mode: "insensitive" as const } } : {}),
      ...(from || to
        ? {
            tradeDate: {
              ...(from ? { gte: new Date(from) } : {}),
              ...(to ? { lte: new Date(to) } : {}),
            },
          }
        : {}),
    };

    const [trades, allTrades] = await Promise.all([
      prisma.trade.findMany({
        where,
        orderBy: { tradeDate: "desc" },
      }),
      prisma.trade.findMany({
        where: { userId: user.id },
      }),
    ]);

    const tradingDays = new Set(
      trades.map((trade) => new Date(trade.tradeDate).toDateString()),
    ).size;

    return Response.json({
      trades,
      summary: {
        totalPnl: calculateMonthlyPnL(trades),
        winRate: calculateWinRate(trades),
        avgRR: calculateAvgRR(trades),
        totalTrades: trades.length,
        bestTrade: trades.length
          ? Math.max(...trades.map((trade) => trade.pnlPercent))
          : 0,
        worstTrade: trades.length
          ? Math.min(...trades.map((trade) => trade.pnlPercent))
          : 0,
        dailyLoss: calculateDailyLoss(trades, tradingDays),
        snapshot: getMonthlySnapshot(allTrades),
      },
    });
  } catch {
    return apiError("Unable to load trades.", 500);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = await safeJson<unknown>(request);
    const parsed = tradeSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { message: "Invalid trade payload.", errors: parsed.error.flatten().fieldErrors },
        { status: 422 },
      );
    }

    const tradeDate = new Date(parsed.data.tradeDate);

    const trade = await prisma.trade.create({
      data: {
        userId: user.id,
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
    return apiError("Unable to save trade.", 500);
  }
}
