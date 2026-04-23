import type { Prisma, Trade } from "@prisma/client";
import { requireUser } from "@/lib/auth";
import { getEquityCurve } from "@/lib/calculations";
import { prisma } from "@/lib/prisma";
import { apiError, getMonthKey } from "@/lib/utils";

// AUDIT FIX: All authenticated API routes must opt out of static rendering
export const dynamic = "force-dynamic";

function toFilterOptions(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)))
    .sort((left, right) => left.localeCompare(right))
    .map((value) => ({
      value,
      label: value,
    }));
}

function buildMonthlyRows(trades: Trade[]) {
  const grouped = trades.reduce<Record<string, Trade[]>>((accumulator, trade) => {
    const key = getMonthKey(trade.tradeDate);
    accumulator[key] = [...(accumulator[key] ?? []), trade];
    return accumulator;
  }, {});

  return Object.entries(grouped)
    .map(([month, monthTrades]) => ({
      month,
      trades: monthTrades.length,
      wins: monthTrades.filter((trade) => trade.outcome === "WIN").length,
      losses: monthTrades.filter((trade) => trade.outcome === "LOSS").length,
      winRate: monthTrades.length
        ? (monthTrades.filter((trade) => trade.outcome === "WIN").length / monthTrades.length) * 100
        : 0,
      pnl: monthTrades.reduce((sum, trade) => sum + trade.pnlPercent, 0),
    }));
}

function buildSetupData(trades: Trade[]) {
  return Object.entries(
    trades.reduce<Record<string, { wins: number; total: number }>>((accumulator, trade) => {
      const key = trade.setupType || "Unknown";
      if (!accumulator[key]) {
        accumulator[key] = { wins: 0, total: 0 };
      }
      accumulator[key].total += 1;
      if (trade.outcome === "WIN") {
        accumulator[key].wins += 1;
      }
      return accumulator;
    }, {}),
  )
    .map(([setup, value]) => ({
      setup,
      winRate: value.total ? (value.wins / value.total) * 100 : 0,
    }))
    .sort((left, right) => right.winRate - left.winRate);
}

function average(values: number[]) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function calculatePsychology(trades: Trade[]) {
  const byEmotion = (emotion: "CALM" | "ANXIOUS" | "FEARFUL") => {
    const emotionTrades = trades.filter((trade) => trade.emotionBefore === emotion);
    const wins = emotionTrades.filter((trade) => trade.outcome === "WIN").length;
    return emotionTrades.length ? (wins / emotionTrades.length) * 100 : 0;
  };

  const plannedTrades = trades.filter((trade) => trade.followedPlan === true);
  const unplannedTrades = trades.filter((trade) => trade.followedPlan === false);
  const revengeTrades = trades.filter((trade) => trade.revenge);
  const winners = trades.filter((trade) => trade.outcome === "WIN");
  const losers = trades.filter((trade) => trade.outcome === "LOSS");

  const winnerEmotion = Object.entries(
    winners.reduce<Record<string, number>>((acc, trade) => {
      const key = trade.emotionBefore ?? "NEUTRAL";
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {}),
  ).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "N/A";

  const loserEmotion = Object.entries(
    losers.reduce<Record<string, number>>((acc, trade) => {
      const key = trade.emotionBefore ?? "NEUTRAL";
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {}),
  ).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "N/A";

  const disciplineRatios = trades.map((trade) => {
    let score = 100;
    if (trade.followedPlan === false) score -= 20;
    if (trade.revenge) score -= 20;
    if (trade.overSized) score -= 15;
    if (trade.movedStop) score -= 15;
    if (trade.exitedEarly) score -= 10;
    return Math.max(0, score);
  });

  return {
    calmWinRate: byEmotion("CALM"),
    anxiousWinRate: byEmotion("ANXIOUS"),
    fearfulWinRate: byEmotion("FEARFUL"),
    avgRFollowedPlan: average(plannedTrades.map((trade) => trade.rrRatio)),
    avgRNotFollowedPlan: average(unplannedTrades.map((trade) => trade.rrRatio)),
    revengeTradesCount: revengeTrades.length,
    revengeTradesPnlImpact: revengeTrades.reduce((sum, trade) => sum + trade.pnlPercent, 0),
    topEmotionOnWins: winnerEmotion,
    topEmotionOnLosses: loserEmotion,
    psychologyScore: average(disciplineRatios),
  };
}

export async function GET(request: Request) {
  try {
    const user = await requireUser();
    const { searchParams } = new URL(request.url);

    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const pairs = searchParams.getAll("pairs");
    const tags = searchParams.getAll("tags");
    const direction = searchParams.get("direction");

    const tradeDateFilter =
      startDate || endDate
        ? {
            tradeDate: {
              ...(startDate ? { gte: new Date(`${startDate}T00:00:00.000Z`) } : {}),
              ...(endDate ? { lte: new Date(`${endDate}T23:59:59.999Z`) } : {}),
            },
          }
        : {};

    const where: Prisma.TradeWhereInput = {
      userId: user.id,
      ...tradeDateFilter,
      ...(pairs.length ? { coin: { in: pairs } } : {}),
      ...(direction && direction !== "ALL" ? { direction: direction as "LONG" | "SHORT" } : {}),
      ...(tags.length
        ? {
            OR: [
              { tags: { hasSome: tags } },
              { setupType: { in: tags } },
            ],
          }
        : {}),
    };

    const [filteredTrades, allTrades] = await Promise.all([
      prisma.trade.findMany({
        where,
        orderBy: { tradeDate: "asc" },
      }),
      prisma.trade.findMany({
        where: { userId: user.id },
        orderBy: { tradeDate: "asc" },
      }),
    ]);

    const wins = filteredTrades.filter((trade) => trade.outcome === "WIN").length;
    const losses = filteredTrades.filter((trade) => trade.outcome === "LOSS").length;
    const startBalance = user.accountSize ?? user.accountBalance;

    return Response.json({
      trades: filteredTrades,
      summary: {
        totalTrades: filteredTrades.length,
        winRate: filteredTrades.length ? (wins / filteredTrades.length) * 100 : 0,
      },
      monthlyRows: buildMonthlyRows(filteredTrades),
      equityCurve: getEquityCurve(filteredTrades, startBalance),
      winLossData: [
        { name: "Wins", value: wins, fill: "#2D6A0F" },
        { name: "Losses", value: losses, fill: "#8B2020" },
      ],
      setupData: buildSetupData(filteredTrades),
      filterOptions: {
        pairs: toFilterOptions(allTrades.map((trade) => trade.coin)),
        tags: toFilterOptions(
          allTrades.flatMap((trade) => [trade.setupType, ...(trade.tags ?? [])]),
        ),
      },
      psychology: calculatePsychology(filteredTrades),
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return apiError("Unauthorized.", 401);
    }
    return apiError("Unable to load analytics.", 500);
  }
}
