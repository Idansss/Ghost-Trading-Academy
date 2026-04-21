import type { Trade } from "@prisma/client";
import { format, getDay } from "date-fns";

/**
 * Calculates risk-to-reward ratio for a trade.
 */
export function calculateRR(entry: number, sl: number, tp: number): number {
  if (entry === sl) return 0;
  return Math.abs(tp - entry) / Math.abs(entry - sl);
}

/**
 * Calculates how much percentage distance exists between entry and stop loss.
 */
export function calculateRiskPercent(entry: number, sl: number): number {
  if (!entry) return 0;
  return (Math.abs(entry - sl) / entry) * 100;
}

/**
 * Calculates position size in units for the configured account risk.
 */
export function calculatePositionSize(
  balance: number,
  riskPercent: number,
  entry: number,
  sl: number,
): number {
  if (entry === sl) return 0;
  return ((balance * riskPercent) / 100) / Math.abs(entry - sl);
}

/**
 * Calculates the win rate for a list of trades.
 */
export function calculateWinRate(trades: Pick<Trade, "outcome">[]): number {
  if (!trades.length) return 0;
  const wins = trades.filter((trade) => trade.outcome === "WIN").length;
  return (wins / trades.length) * 100;
}

/**
 * Calculates the monthly percentage PnL for a set of trades.
 */
export function calculateMonthlyPnL(trades: Pick<Trade, "pnlPercent">[]): number {
  return trades.reduce((sum, trade) => sum + trade.pnlPercent, 0);
}

/**
 * Calculates the average risk-to-reward ratio across trades.
 */
export function calculateAvgRR(trades: Pick<Trade, "rrRatio">[]): number {
  if (!trades.length) return 0;
  return trades.reduce((sum, trade) => sum + trade.rrRatio, 0) / trades.length;
}

/**
 * Calculates average daily loss over a number of trading days.
 */
export function calculateDailyLoss(
  trades: Pick<Trade, "pnlPercent">[],
  tradingDays: number,
): number {
  if (!tradingDays) return 0;
  const totalLoss = trades
    .filter((trade) => trade.pnlPercent < 0)
    .reduce((sum, trade) => sum + trade.pnlPercent, 0);

  return totalLoss / tradingDays;
}

/**
 * Produces a keyed monthly snapshot for all trade PnL values.
 */
export function getMonthlySnapshot(
  allTrades: Pick<Trade, "tradeDate" | "pnlPercent">[],
): Record<string, number> {
  return allTrades.reduce<Record<string, number>>((accumulator, trade) => {
    const key = format(new Date(trade.tradeDate), "MMM_yyyy").toUpperCase();
    accumulator[key] = (accumulator[key] ?? 0) + trade.pnlPercent;
    return accumulator;
  }, {});
}

/**
 * Calculates a cumulative equity curve using percentage gains and losses.
 */
export function getEquityCurve(
  trades: Pick<Trade, "tradeDate" | "pnlPercent">[],
  startBalance: number,
) {
  const sortedTrades = [...trades].sort(
    (left, right) =>
      new Date(left.tradeDate).getTime() - new Date(right.tradeDate).getTime(),
  );

  let balance = startBalance;

  return sortedTrades.map((trade) => {
    balance += balance * (trade.pnlPercent / 100);
    return {
      date: format(new Date(trade.tradeDate), "MMM d"),
      balance,
    };
  });
}

/**
 * Finds the best performing trade setup by win rate.
 */
export function getBestSetup(
  trades: Pick<Trade, "setupType" | "outcome">[],
): { setup: string; winRate: number; count: number } {
  const setups = trades.reduce<Record<string, { wins: number; total: number }>>(
    (accumulator, trade) => {
      if (!accumulator[trade.setupType]) {
        accumulator[trade.setupType] = { wins: 0, total: 0 };
      }

      accumulator[trade.setupType].total += 1;
      if (trade.outcome === "WIN") {
        accumulator[trade.setupType].wins += 1;
      }

      return accumulator;
    },
    {},
  );

  const [setup = "", values = { wins: 0, total: 0 }] =
    Object.entries(setups).sort((left, right) => {
      const leftRate = left[1].total ? left[1].wins / left[1].total : 0;
      const rightRate = right[1].total ? right[1].wins / right[1].total : 0;
      return rightRate - leftRate;
    })[0] ?? [];

  return {
    setup,
    winRate: values.total ? (values.wins / values.total) * 100 : 0,
    count: values.total,
  };
}

/**
 * Counts wins grouped by weekday for performance insights.
 */
export function getWeekdayPerformance(
  trades: Pick<Trade, "tradeDate" | "outcome">[],
) {
  return trades.reduce<Record<number, { wins: number; losses: number }>>(
    (accumulator, trade) => {
      const day = getDay(new Date(trade.tradeDate));
      if (!accumulator[day]) {
        accumulator[day] = { wins: 0, losses: 0 };
      }

      if (trade.outcome === "WIN") accumulator[day].wins += 1;
      if (trade.outcome === "LOSS") accumulator[day].losses += 1;
      return accumulator;
    },
    {},
  );
}
