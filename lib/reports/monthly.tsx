import { Trade } from "@prisma/client";
import { format } from "date-fns";
import { renderToBuffer } from "@react-pdf/renderer";
import { MonthlyReport } from "@/lib/reports/MonthlyReport";
import { prisma } from "@/lib/prisma";

function toMonthRange(month: string) {
  const [year, monthPart] = month.split("-").map(Number);
  const start = new Date(Date.UTC(year, monthPart - 1, 1));
  const end = new Date(Date.UTC(year, monthPart, 0, 23, 59, 59, 999));
  return { start, end };
}

function equityPath(trades: Trade[]) {
  if (!trades.length) return "M0 80 L520 80";
  const width = 520;
  const height = 160;
  let equity = 0;
  const series = trades.map((trade) => {
    equity += trade.pnlPercent;
    return equity;
  });
  const min = Math.min(...series, 0);
  const max = Math.max(...series, 1);
  const scaleY = (value: number) =>
    height - ((value - min) / (max - min || 1)) * (height - 10) - 5;
  const scaleX = (idx: number) => (idx / Math.max(1, series.length - 1)) * width;
  return series
    .map((value, idx) => `${idx === 0 ? "M" : "L"}${scaleX(idx)} ${scaleY(value)}`)
    .join(" ");
}

function getProfitFactor(trades: Trade[]) {
  const grossProfit = trades.filter((t) => t.pnlPercent > 0).reduce((s, t) => s + t.pnlPercent, 0);
  const grossLoss = Math.abs(
    trades.filter((t) => t.pnlPercent < 0).reduce((s, t) => s + t.pnlPercent, 0),
  );
  if (!grossLoss) return grossProfit > 0 ? 999 : 0;
  return grossProfit / grossLoss;
}

export async function generateMonthlyReportBuffer(userId: string, month: string) {
  const { start, end } = toMonthRange(month);
  const [user, trades, latestReview, siteConfig] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.trade.findMany({
      where: { userId, tradeDate: { gte: start, lte: end } },
      orderBy: { tradeDate: "asc" },
    }),
    prisma.weeklyReview.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
    }),
    prisma.siteConfig.findUnique({ where: { id: "main" } }),
  ]);
  if (!user) {
    throw new Error("User not found.");
  }

  const wins = trades.filter((t) => t.outcome === "WIN").length;
  const emotionBreakdown = Object.entries(
    trades.reduce<Record<string, number>>((acc, trade) => {
      const key = trade.emotionBefore ?? "NEUTRAL";
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {}),
  ).map(([emotion, count]) => ({ emotion, count }));

  const planAdherenceRate =
    trades.length > 0
      ? (trades.filter((trade) => trade.followedPlan === true).length / trades.length) * 100
      : 0;
  const disciplineScore =
    trades.length > 0
      ? Math.round(
          trades
            .map((trade) => {
              let score = 100;
              if (trade.followedPlan === false) score -= 20;
              if (trade.revenge) score -= 20;
              if (trade.overSized) score -= 15;
              if (trade.movedStop) score -= 15;
              if (trade.exitedEarly) score -= 10;
              return Math.max(0, score);
            })
            .reduce((sum, value) => sum + value, 0) / trades.length,
        )
      : 0;

  const tagStats = Object.entries(
    trades.reduce<Record<string, { total: number; count: number }>>((acc, trade) => {
      for (const tag of trade.tags ?? []) {
        acc[tag] = acc[tag] ?? { total: 0, count: 0 };
        acc[tag].total += trade.pnlPercent;
        acc[tag].count += 1;
      }
      return acc;
    }, {}),
  ).map(([tag, value]) => ({
    tag,
    avgPnl: value.total / Math.max(1, value.count),
  }));

  const report = (
    <MonthlyReport
      platformName={siteConfig?.platformName ?? "The Thesis Desk"}
      monthLabel={format(start, "MMMM yyyy")}
      memberName={user.name}
      summary={{
        totalTrades: trades.length,
        winRate: trades.length ? (wins / trades.length) * 100 : 0,
        totalR: trades.reduce((sum, trade) => sum + trade.rrRatio, 0),
        avgR: trades.length
          ? trades.reduce((sum, trade) => sum + trade.rrRatio, 0) / trades.length
          : 0,
        bestTrade: trades.length ? Math.max(...trades.map((trade) => trade.pnlPercent)) : 0,
        worstTrade: trades.length ? Math.min(...trades.map((trade) => trade.pnlPercent)) : 0,
        profitFactor: getProfitFactor(trades),
      }}
      psychology={{
        emotionBreakdown,
        disciplineScore,
        planAdherenceRate,
      }}
      bestTags={tagStats.sort((a, b) => b.avgPnl - a.avgPnl).slice(0, 3)}
      worstTags={tagStats.sort((a, b) => a.avgPnl - b.avgPnl).slice(0, 3)}
      nextMonthGoal={latestReview?.nextWeekFocus ?? "No goal set."}
      equityPath={equityPath(trades)}
      trades={trades.map((trade) => ({
        date: format(trade.tradeDate, "yyyy-MM-dd"),
        pair: trade.coin,
        direction: trade.direction,
        entry: trade.entryPrice,
        exit: trade.takeProfit,
        rResult: trade.rrRatio,
        tags: (trade.tags ?? []).join(", "),
      }))}
    />
  );

  return renderToBuffer(report);
}
