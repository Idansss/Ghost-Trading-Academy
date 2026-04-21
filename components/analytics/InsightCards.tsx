"use client";

import type { Trade } from "@prisma/client";
import { format } from "date-fns";
import { motion } from "framer-motion";
import {
  AlertCircle,
  AlertTriangle,
  CalendarDays,
  Flame,
  Snowflake,
  Star,
  Target,
  TrendingDown,
} from "lucide-react";
import { cn } from "@/lib/utils";

function isWin(trade: Trade) {
  return trade.outcome === "WIN";
}

function isLoss(trade: Trade) {
  return trade.outcome === "LOSS";
}

export function getBestMonth(trades: Trade[]) {
  const monthlyPnl = trades.reduce<Record<string, number>>((accumulator, trade) => {
    const month = format(new Date(trade.tradeDate), "MMMM yyyy");
    accumulator[month] = (accumulator[month] ?? 0) + (trade.pnlPercent ?? 0);
    return accumulator;
  }, {});

  const [month, pnl] =
    Object.entries(monthlyPnl).sort((left, right) => right[1] - left[1])[0] ?? [];

  return month ? { month, pnl } : null;
}

export function getWorstMonth(trades: Trade[]) {
  const monthlyPnl = trades.reduce<Record<string, number>>((accumulator, trade) => {
    const month = format(new Date(trade.tradeDate), "MMMM yyyy");
    accumulator[month] = (accumulator[month] ?? 0) + (trade.pnlPercent ?? 0);
    return accumulator;
  }, {});

  const [month, pnl] =
    Object.entries(monthlyPnl).sort((left, right) => left[1] - right[1])[0] ?? [];

  if (!month || pnl >= 0) {
    return null;
  }

  return { month, pnl };
}

export function getBestSetup(trades: Trade[]) {
  const grouped = trades.reduce<Record<string, { wins: number; total: number }>>(
    (accumulator, trade) => {
      const setup = trade.setupType || "Unknown";
      if (!accumulator[setup]) {
        accumulator[setup] = { wins: 0, total: 0 };
      }
      accumulator[setup].total += 1;
      if (isWin(trade)) {
        accumulator[setup].wins += 1;
      }
      return accumulator;
    },
    {},
  );

  const eligible = Object.entries(grouped)
    .filter(([, value]) => value.total >= 3)
    .map(([setup, value]) => ({
      setup,
      winRate: (value.wins / value.total) * 100,
      count: value.total,
    }))
    .sort((left, right) => right.winRate - left.winRate)[0];

  return eligible ?? null;
}

function getDayPerformance(trades: Trade[]) {
  const dayNames = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  return dayNames
    .map((day, index) => {
      const dayTrades = trades.filter(
        (trade) => new Date(trade.tradeDate).getDay() === index,
      );

      const wins = dayTrades.filter(isWin).length;
      const losses = dayTrades.filter(isLoss).length;

      return {
        day,
        wins,
        losses,
        total: dayTrades.length,
        winRate: dayTrades.length ? (wins / dayTrades.length) * 100 : 0,
      };
    })
    .filter((entry) => entry.total >= 2);
}

export function getBestDay(trades: Trade[]) {
  return (
    getDayPerformance(trades).sort((left, right) => right.winRate - left.winRate)[0] ??
    null
  );
}

export function getWorstDay(trades: Trade[]) {
  const result = getDayPerformance(trades).sort(
    (left, right) => left.winRate - right.winRate,
  )[0];

  if (!result || result.losses <= result.wins) {
    return null;
  }

  return result;
}

export function getCurrentStreak(trades: Trade[]) {
  const sortedTrades = [...trades].sort(
    (left, right) =>
      new Date(right.tradeDate).getTime() - new Date(left.tradeDate).getTime(),
  );

  const first = sortedTrades.find((trade) => isWin(trade) || isLoss(trade));

  if (!first) {
    return null;
  }

  const type = isWin(first) ? "win" : "loss";
  let count = 0;

  for (const trade of sortedTrades) {
    if (type === "win" && isWin(trade)) {
      count += 1;
      continue;
    }

    if (type === "loss" && isLoss(trade)) {
      count += 1;
      continue;
    }

    break;
  }

  return { type, count };
}

export function getAvgRisk(trades: Trade[]) {
  const riskValues = trades
    .map((trade) => trade.riskPercent)
    .filter((value): value is number => value !== null && value !== undefined);

  if (!riskValues.length) {
    return null;
  }

  return riskValues.reduce((sum, value) => sum + value, 0) / riskValues.length;
}

type InsightCard = {
  borderClassName: string;
  iconClassName: string;
  title: string;
  detail: string;
  icon: React.ComponentType<{ className?: string }>;
};

export function InsightCards({ trades }: { trades: Trade[] }) {
  if (trades.length < 5) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="rounded-lg border-l-[3px] border-border bg-[color:var(--bg-surface)] p-4"
      >
        <div className="flex items-center gap-3">
          <div className="grid h-8 w-8 place-items-center rounded-full bg-muted text-muted-foreground">
            <AlertCircle className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-medium text-primary">
              Log at least 5 trades to unlock insights.
            </p>
            <p className="text-xs text-muted-foreground">
              Add more journal entries to generate reliable patterns.
            </p>
          </div>
        </div>
      </motion.div>
    );
  }

  const insights: InsightCard[] = [];
  const bestMonth = getBestMonth(trades);
  const worstMonth = getWorstMonth(trades);
  const bestSetup = getBestSetup(trades);
  const bestDay = getBestDay(trades);
  const worstDay = getWorstDay(trades);
  const streak = getCurrentStreak(trades);
  const avgRisk = getAvgRisk(trades);

  if (bestMonth) {
    insights.push({
      borderClassName: "border-[color:var(--color-gold)]",
      iconClassName: "bg-[color:var(--color-gold-light)] text-[color:var(--color-gold)]",
      icon: Star,
      title: `Best month: ${bestMonth.month}`,
      detail: `${bestMonth.pnl >= 0 ? "+" : ""}${bestMonth.pnl.toFixed(1)}% — your strongest month so far`,
    });
  }

  if (worstMonth) {
    insights.push({
      borderClassName: "border-[color:var(--color-red)]",
      iconClassName: "bg-[color:var(--color-red-light)] text-[color:var(--color-red)]",
      icon: TrendingDown,
      title: `Rough month: ${worstMonth.month}`,
      detail: `${worstMonth.pnl.toFixed(1)}% — review those trades for patterns`,
    });
  }

  if (bestSetup) {
    insights.push({
      borderClassName: "border-[color:var(--color-gold)]",
      iconClassName: "bg-[color:var(--color-gold-light)] text-[color:var(--color-gold)]",
      icon: Target,
      title: `Top setup: ${bestSetup.setup}`,
      detail: `${bestSetup.winRate.toFixed(0)}% win rate across ${bestSetup.count} trades`,
    });
  }

  if (bestDay) {
    insights.push({
      borderClassName: "border-[color:var(--color-gold)]",
      iconClassName: "bg-[color:var(--color-gold-light)] text-[color:var(--color-gold)]",
      icon: CalendarDays,
      title: `Best day to trade: ${bestDay.day}`,
      detail: `${bestDay.winRate.toFixed(0)}% win rate on ${bestDay.day}s`,
    });
  }

  if (worstDay) {
    insights.push({
      borderClassName: "border-[color:var(--color-red)]",
      iconClassName: "bg-[color:var(--color-red-light)] text-[color:var(--color-red)]",
      icon: AlertCircle,
      title: `Avoid trading on ${worstDay.day}`,
      detail: `Your loss rate is highest on ${worstDay.day}s`,
    });
  }

  if (streak) {
    insights.push({
      borderClassName:
        streak.type === "win"
          ? "border-[color:var(--color-gold)]"
          : "border-[color:var(--color-blue)]",
      iconClassName:
        streak.type === "win"
          ? "bg-[color:var(--color-gold-light)] text-[color:var(--color-gold)]"
          : "bg-[color:var(--color-blue)]/10 text-[color:var(--color-blue)]",
      icon: streak.type === "win" ? Flame : Snowflake,
      title:
        streak.type === "win"
          ? `${streak.count}-trade win streak 🔥`
          : `${streak.count}-trade losing run`,
      detail:
        streak.type === "win"
          ? "Stay disciplined and stick to the plan"
          : `Pause and review your last ${streak.count} entries before continuing`,
    });
  }

  if (avgRisk !== null) {
    insights.push({
      borderClassName:
        avgRisk > 2
          ? "border-[color:var(--color-red)]"
          : avgRisk <= 1
            ? "border-[color:var(--color-green)]"
            : "border-border",
      iconClassName:
        avgRisk > 2
          ? "bg-[color:var(--color-red-light)] text-[color:var(--color-red)]"
          : avgRisk <= 1
            ? "bg-[color:var(--color-green-light)] text-[color:var(--color-green)]"
            : "bg-muted text-muted-foreground",
      icon: AlertTriangle,
      title: `Avg risk per trade: ${avgRisk.toFixed(2)}%`,
      detail:
        avgRisk > 2
          ? "Above recommended max of 2%. Consider reducing."
          : "Healthy risk management",
    });
  }

  return (
    <>
      {insights.map((insight, index) => {
        const Icon = insight.icon;

        return (
          <motion.div
            key={`${insight.title}-${index}`}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.08, duration: 0.3 }}
            className={cn(
              "rounded-lg border-l-[3px] bg-[color:var(--bg-surface)] p-4",
              insight.borderClassName,
            )}
          >
            <div className="flex items-center gap-3">
              <div className={cn("grid h-8 w-8 place-items-center rounded-full", insight.iconClassName)}>
                <Icon className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-medium text-primary">{insight.title}</p>
                <p className="text-xs text-muted-foreground">{insight.detail}</p>
              </div>
            </div>
          </motion.div>
        );
      })}
    </>
  );
}
