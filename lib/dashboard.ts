import type { OnboardingStep } from "@prisma/client";
import { Prisma } from "@prisma/client";
import { startOfMonth } from "date-fns";
import {
  calculateAvgRR,
  calculateMonthlyPnL,
  calculateWinRate,
  getBestSetup,
  getEquityCurve,
  getMonthlySnapshot,
  getTagPerformance,
  getWeekdayPerformance,
} from "@/lib/calculations";
import { getOnboardingSnapshot } from "@/lib/onboarding";
import { activeSignalStatuses } from "@/lib/signal-performance";
import { getSevenDayJournalHeatmap } from "@/lib/streak";
import { getMonthKey } from "@/lib/utils";
import { prisma } from "@/lib/prisma";
import logger from "@/server/core/logger";

const weekdayLabels = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const dashboardUserFallback: {
  onboardingCompleted: boolean;
  onboardingProgress: OnboardingStep[];
  journalStreak: number;
  longestStreak: number;
  disciplineScore: number;
  lastJournalDate: Date | null;
} = {
  onboardingCompleted: false,
  onboardingProgress: [],
  journalStreak: 0,
  longestStreak: 0,
  disciplineScore: 0,
  lastJournalDate: null,
};

function isOptionalDashboardSchemaError(
  error: unknown,
): error is Prisma.PrismaClientKnownRequestError {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    (error.code === "P2021" || error.code === "P2022")
  );
}

async function optionalDashboardQuery<T>(
  key: string,
  run: () => Promise<T>,
  fallback: T,
): Promise<T> {
  try {
    return await run();
  } catch (error) {
    if (isOptionalDashboardSchemaError(error)) {
      logger.warn({
        type: "dashboard_optional_schema_fallback",
        key,
        code: error.code,
        message: error.message,
      });
      return fallback;
    }

    throw error;
  }
}

export async function getDashboardData(userId: string, accountBalance: number) {
  const currentMonthKey = getMonthKey(new Date());

  const [user, monthTrades, allTrades, recentTrades, latestOutlook, activeSignals, streakHeatmap, latestWeeklyReview] =
    await Promise.all([
      optionalDashboardQuery(
        "user_dashboard_fields",
        () =>
          prisma.user.findUnique({
            where: { id: userId },
            select: {
              onboardingCompleted: true,
              onboardingProgress: true,
              journalStreak: true,
              longestStreak: true,
              disciplineScore: true,
              lastJournalDate: true,
            },
          }),
        dashboardUserFallback,
      ),
      prisma.trade.findMany({
        where: {
          userId,
          month: currentMonthKey,
        },
        orderBy: { tradeDate: "asc" },
      }),
      prisma.trade.findMany({
        where: { userId },
        orderBy: { tradeDate: "asc" },
      }),
      prisma.trade.findMany({
        where: { userId },
        orderBy: { tradeDate: "desc" },
        take: 5,
      }),
      prisma.dailyOutlook.findFirst({
        orderBy: { date: "desc" },
      }),
      prisma.signal.count({
        where: {
          status: { in: activeSignalStatuses },
        },
      }),
      getSevenDayJournalHeatmap(userId),
      optionalDashboardQuery(
        "weekly_review",
        () =>
          prisma.weeklyReview.findFirst({
            where: { userId },
            orderBy: { weekStartDate: "desc" },
          }),
        null,
      ),
    ]);

  const weekdayPerformance = getWeekdayPerformance(monthTrades);
  const weakestWeekdayEntry =
    Object.entries(weekdayPerformance)
      .map(([day, result]) => {
        const total = result.wins + result.losses;
        return {
          day: Number(day),
          total,
          winRate: total ? (result.wins / total) * 100 : 0,
        };
      })
      .filter((entry) => entry.total > 0)
      .sort((left, right) => left.winRate - right.winRate)[0] ?? null;

  const bestSetup = getBestSetup(monthTrades);
  const weakestTag =
    getTagPerformance(monthTrades)
      .filter((entry) => entry.count >= 2)
      .sort((left, right) => left.avgPnl - right.avgPnl)[0] ?? null;
  const latestTrade = recentTrades[0] ?? null;
  const fearfulTrades = monthTrades.filter((trade) => trade.emotionBefore === "FEARFUL");
  const fearfulLossRate = fearfulTrades.length
    ? (fearfulTrades.filter((trade) => trade.outcome === "LOSS").length / fearfulTrades.length) * 100
    : null;
  // AUDIT FIX: Previously built 5 focus items unconditionally. The spec requires
  // a maximum of 3 items that surface the most impactful insights. We now collect
  // only the non-generic (data-driven) items first and cap the result at 3.
  const potentialFocusItems: string[] = [];

  if (latestOutlook) {
    potentialFocusItems.push(
      `Bias is ${latestOutlook.marketBias.toLowerCase()}; align entries with that direction.`,
    );
  }
  if (bestSetup.setup) {
    potentialFocusItems.push(
      `Your best setup this month is ${bestSetup.setup}${bestSetup.tagContext ? ` when paired with ${bestSetup.tagContext}` : ""} at ${bestSetup.winRate.toFixed(1)}% across ${bestSetup.count} trades.`,
    );
  }
  if (fearfulLossRate !== null) {
    potentialFocusItems.push(
      `You lose ${fearfulLossRate.toFixed(0)}% of trades taken in a fearful state. Wait for calm confirmation before entry.`,
    );
  }
  if (weakestWeekdayEntry) {
    potentialFocusItems.push(
      `Your weakest weekday is ${weekdayLabels[weakestWeekdayEntry.day]} at ${weakestWeekdayEntry.winRate.toFixed(1)}% win rate.`,
    );
  }
  if (weakestTag && weakestTag.avgPnl < 0) {
    potentialFocusItems.push(
      `${weakestTag.tag} trades are costing you ${weakestTag.avgPnl.toFixed(2)}% on average across ${weakestTag.count} entries. Review that behavior before repeating it.`,
    );
  }

  if (potentialFocusItems.length === 0) {
    potentialFocusItems.push(
      "No market outlook is posted yet; size down until bias is clear.",
      "Log more trades to surface your best setup.",
      "Track your pre-trade emotion to reveal psychology edge over time.",
    );
  }

  const focusItems = potentialFocusItems.slice(0, 3);

  return {
    kpis: {
      totalPnl: calculateMonthlyPnL(monthTrades),
      winRate: calculateWinRate(monthTrades),
      avgRR: calculateAvgRR(monthTrades),
      totalTrades: monthTrades.length,
    },
    equityCurve: getEquityCurve(
      monthTrades.filter((trade) => trade.tradeDate >= startOfMonth(new Date())),
      accountBalance,
    ),
    monthlySnapshot: getMonthlySnapshot(allTrades),
    recentTrades,
    latestOutlook,
    activeSignals,
    bestSetup,
    weakestWeekday: weakestWeekdayEntry
      ? {
          label: weekdayLabels[weakestWeekdayEntry.day],
          winRate: weakestWeekdayEntry.winRate,
          totalTrades: weakestWeekdayEntry.total,
        }
      : null,
    latestTrade,
    focusItems,
    streak: {
      current: user?.journalStreak ?? 0,
      longest: user?.longestStreak ?? 0,
      disciplineScore: user?.disciplineScore ?? 0,
      lastJournalDate: user?.lastJournalDate?.toISOString() ?? null,
      heatmap: streakHeatmap,
    },
    onboarding: getOnboardingSnapshot(
      user?.onboardingProgress ?? [],
      user?.onboardingCompleted ?? false,
    ),
    pinnedFocus: latestWeeklyReview?.nextWeekFocus ?? null,
  };
}
