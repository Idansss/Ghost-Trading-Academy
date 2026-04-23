import type { Signal, SignalStatus } from "@prisma/client";
import { subDays } from "date-fns";
import { prisma } from "@/lib/prisma";

export const signalFilterStatuses = [
  "ALL",
  "ACTIVE",
  "TP1_HIT",
  "TP2_HIT",
  "TP3_HIT",
  "STOPPED",
  "CANCELLED",
  "CLOSED",
] as const;

export const activeSignalStatuses: SignalStatus[] = ["ACTIVE", "TP1_HIT", "TP2_HIT"];
export const settledSignalStatuses: SignalStatus[] = ["TP3_HIT", "STOPPED", "CANCELLED", "CLOSED"];

export type SignalTrackRecordRow = Pick<
  Signal,
  | "id"
  | "coin"
  | "direction"
  | "status"
  | "tp1Hit"
  | "tp2Hit"
  | "tp3Hit"
  | "stopHit"
  | "finalPnlR"
  | "closedAt"
  | "postedAt"
  | "entryZone"
  | "stopLoss"
  | "tp1"
  | "tp2"
  | "tp3"
  | "rrRatio"
  | "outcomeNote"
>;

export type SignalPerformanceStats = {
  totalSignals: number;
  winRate: number;
  fullTp3Rate: number;
  avgR: number;
  winStreak: number;
  lossStreak: number;
};

export function getSignalStatusVariant(status: SignalStatus) {
  if (status === "STOPPED") return "danger" as const;
  if (status === "CANCELLED") return "muted" as const;
  if (status === "ACTIVE") return "info" as const;
  if (status === "CLOSED") return "default" as const;
  return "success" as const;
}

export function getSignalOutcomeLabel(signal: Pick<SignalTrackRecordRow, "status" | "tp1Hit" | "tp2Hit" | "tp3Hit" | "stopHit" | "finalPnlR">) {
  if (signal.status === "STOPPED" || signal.stopHit || (signal.finalPnlR ?? 0) < 0) {
    return "Stopped";
  }
  if (signal.status === "CANCELLED") {
    return "Cancelled";
  }
  if (signal.status === "TP3_HIT" || signal.tp3Hit) {
    return "TP3 Hit";
  }
  if (signal.status === "TP2_HIT" || signal.tp2Hit) {
    return "TP2 Hit";
  }
  if (signal.status === "TP1_HIT" || signal.tp1Hit) {
    return "TP1 Hit";
  }
  if (signal.status === "CLOSED") {
    if ((signal.finalPnlR ?? 0) > 0) return "Closed In Profit";
    if ((signal.finalPnlR ?? 0) < 0) return "Closed In Loss";
    return "Closed";
  }
  return "Active";
}

function isWinningSignal(signal: Pick<SignalTrackRecordRow, "tp1Hit" | "tp2Hit" | "tp3Hit" | "status" | "finalPnlR">) {
  return signal.tp1Hit || signal.tp2Hit || signal.tp3Hit || (signal.finalPnlR ?? 0) > 0 || signal.status === "TP3_HIT";
}

function isLosingSignal(signal: Pick<SignalTrackRecordRow, "stopHit" | "status" | "finalPnlR">) {
  return signal.stopHit || signal.status === "STOPPED" || (signal.finalPnlR ?? 0) < 0;
}

export function calculateSignalPerformanceStats(signals: SignalTrackRecordRow[]): SignalPerformanceStats {
  if (signals.length === 0) {
    return {
      totalSignals: 0,
      winRate: 0,
      fullTp3Rate: 0,
      avgR: 0,
      winStreak: 0,
      lossStreak: 0,
    };
  }

  const totalSignals = signals.length;
  // AUDIT FIX: Win rate must exclude CANCELLED signals from both numerator and
  // denominator. Only TP_HIT statuses count as wins and STOPPED counts as a loss.
  const settledSignals = signals.filter((signal) => signal.status !== "CANCELLED");
  const wins = settledSignals.filter(isWinningSignal).length;
  const settledCount = settledSignals.length;
  const fullTp3Hits = signals.filter((signal) => signal.tp3Hit || signal.status === "TP3_HIT").length;
  const totalR = signals.reduce((sum, signal) => sum + (signal.finalPnlR ?? 0), 0);

  let currentWinStreak = 0;
  let currentLossStreak = 0;
  let longestWinStreak = 0;
  let longestLossStreak = 0;

  signals
    .slice()
    .sort((left, right) => {
      const leftDate = left.closedAt ?? left.postedAt;
      const rightDate = right.closedAt ?? right.postedAt;
      return leftDate.getTime() - rightDate.getTime();
    })
    .forEach((signal) => {
      if (isWinningSignal(signal)) {
        currentWinStreak += 1;
        currentLossStreak = 0;
        longestWinStreak = Math.max(longestWinStreak, currentWinStreak);
        return;
      }

      if (isLosingSignal(signal)) {
        currentLossStreak += 1;
        currentWinStreak = 0;
        longestLossStreak = Math.max(longestLossStreak, currentLossStreak);
        return;
      }

      currentWinStreak = 0;
      currentLossStreak = 0;
    });

  return {
    totalSignals,
    // AUDIT FIX: Use settledCount (non-CANCELLED) as the win rate denominator.
    winRate: settledCount > 0 ? Number(((wins / settledCount) * 100).toFixed(1)) : 0,
    fullTp3Rate: totalSignals > 0 ? Number(((fullTp3Hits / totalSignals) * 100).toFixed(1)) : 0,
    avgR: totalSignals > 0 ? Number((totalR / totalSignals).toFixed(2)) : 0,
    winStreak: longestWinStreak,
    lossStreak: longestLossStreak,
  };
}

export function buildSignalEquityCurve(signals: SignalTrackRecordRow[]) {
  let cumulativeR = 0;

  return signals
    .slice()
    .sort((left, right) => {
      const leftDate = left.closedAt ?? left.postedAt;
      const rightDate = right.closedAt ?? right.postedAt;
      return leftDate.getTime() - rightDate.getTime();
    })
    .map((signal) => {
      cumulativeR += signal.finalPnlR ?? 0;
      const date = signal.closedAt ?? signal.postedAt;

      return {
        id: signal.id,
        date: date.toISOString().slice(0, 10),
        coin: signal.coin,
        cumulativeR: Number(cumulativeR.toFixed(2)),
        resultR: Number((signal.finalPnlR ?? 0).toFixed(2)),
      };
    });
}

export async function getSignalTrackRecord(range: "30d" | "90d" | "all" = "all") {
  const since =
    range === "30d" ? subDays(new Date(), 30) : range === "90d" ? subDays(new Date(), 90) : null;

  const signals = await prisma.signal.findMany({
    where: {
      status: { in: settledSignalStatuses },
      ...(since ? { closedAt: { gte: since } } : {}),
    },
    orderBy: { closedAt: "desc" },
    select: {
      id: true,
      coin: true,
      direction: true,
      status: true,
      tp1Hit: true,
      tp2Hit: true,
      tp3Hit: true,
      stopHit: true,
      finalPnlR: true,
      closedAt: true,
      postedAt: true,
      entryZone: true,
      stopLoss: true,
      tp1: true,
      tp2: true,
      tp3: true,
      rrRatio: true,
      outcomeNote: true,
    },
  });

  return {
    stats: calculateSignalPerformanceStats(signals),
    signals,
    equityCurve: buildSignalEquityCurve(signals),
  };
}
