import { startOfMonth } from "date-fns";
import {
  calculateAvgRR,
  calculateMonthlyPnL,
  calculateWinRate,
  getBestSetup,
  getEquityCurve,
  getMonthlySnapshot,
  getWeekdayPerformance,
} from "@/lib/calculations";
import { getMonthKey } from "@/lib/utils";
import { prisma } from "@/lib/prisma";

const weekdayLabels = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export async function getDashboardData(userId: string, accountBalance: number) {
  const currentMonthKey = getMonthKey(new Date());

  const [monthTrades, allTrades, recentTrades, latestOutlook, activeSignals, signalTakenCount, resourceCompletionCount, memberWinCount] =
    await Promise.all([
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
          status: { in: ["ACTIVE", "PENDING"] },
        },
      }),
      prisma.signalTaken.count({ where: { userId } }),
      prisma.resourceCompletion.count({ where: { userId } }),
      prisma.memberWin.count({ where: { userId } }),
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
  const latestTrade = recentTrades[0] ?? null;
  const focusItems = [
    latestOutlook
      ? `Bias is ${latestOutlook.marketBias.toLowerCase()}; align entries with that direction.`
      : "No market outlook is posted yet; size down until bias is clear.",
    bestSetup.setup
      ? `Your best setup this month is ${bestSetup.setup} at ${bestSetup.winRate.toFixed(1)}% across ${bestSetup.count} trades.`
      : "You do not have enough journal data yet to identify your best setup.",
    weakestWeekdayEntry
      ? `Your weakest weekday is ${weekdayLabels[weakestWeekdayEntry.day]} at ${weakestWeekdayEntry.winRate.toFixed(1)}% win rate.`
      : "Weekday performance data will appear once you log more trades.",
  ];

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
    onboarding: {
      hasTrades: allTrades.length > 0,
      hasSignalsTaken: signalTakenCount > 0,
      hasCompletedResources: resourceCompletionCount > 0,
      hasWins: memberWinCount > 0,
    },
  };
}
