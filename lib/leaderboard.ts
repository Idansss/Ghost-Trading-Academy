import { startOfMonth } from "date-fns";
import { prisma } from "@/lib/prisma";

type LeaderboardTimeframe = "month" | "all";

type LeaderboardTrade = {
  outcome: "WIN" | "LOSS" | "BREAKEVEN" | "PENDING" | "CANCELLED";
  rrRatio: number;
};

type LeaderboardUser = {
  id: string;
  name: string;
  avatarUrl: string | null;
  leaderboardOptIn: boolean;
  journalStreak: number;
  trades: LeaderboardTrade[];
};

export type LeaderboardRow = {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  winRate: number;
  totalTrades: number;
  avgR: number;
  currentStreak: number;
  rank: number;
};

export type LeaderboardResult = {
  timeframe: LeaderboardTimeframe;
  top: LeaderboardRow[];
  currentUser: LeaderboardRow | null;
  currentUserEligible: boolean;
  includeAllMembers: boolean;
};

const MIN_TRADES = 10;

function toSignedR(trade: LeaderboardTrade) {
  if (trade.outcome === "WIN") return trade.rrRatio;
  if (trade.outcome === "LOSS") return -1;
  return 0;
}

function toClosedTrades(trades: LeaderboardTrade[]) {
  return trades.filter((trade) => trade.outcome !== "PENDING" && trade.outcome !== "CANCELLED");
}

function buildLeaderboardRows(users: LeaderboardUser[], includeAllMembers = false) {
  return users
    .map<LeaderboardRow | null>((user) => {
      const closedTrades = toClosedTrades(user.trades);

      if (
        !includeAllMembers &&
        (!user.leaderboardOptIn || closedTrades.length < MIN_TRADES)
      ) {
        return null;
      }

      const wins = closedTrades.filter((trade) => trade.outcome === "WIN").length;
      const avgR =
        closedTrades.length
          ? closedTrades.reduce((sum, trade) => sum + toSignedR(trade), 0) / closedTrades.length
          : 0;

      return {
        userId: user.id,
        displayName: user.name,
        avatarUrl: user.avatarUrl,
        winRate: closedTrades.length ? (wins / closedTrades.length) * 100 : 0,
        totalTrades: closedTrades.length,
        avgR,
        currentStreak: user.journalStreak,
        rank: 0,
      };
    })
    .filter((row): row is LeaderboardRow => row !== null)
    .sort((left, right) => {
      if ((right.totalTrades > 0 ? 1 : 0) !== (left.totalTrades > 0 ? 1 : 0)) {
        return (right.totalTrades > 0 ? 1 : 0) - (left.totalTrades > 0 ? 1 : 0);
      }
      if (right.winRate !== left.winRate) return right.winRate - left.winRate;
      if (right.avgR !== left.avgR) return right.avgR - left.avgR;
      if (right.totalTrades !== left.totalTrades) return right.totalTrades - left.totalTrades;
      if (right.currentStreak !== left.currentStreak) {
        return right.currentStreak - left.currentStreak;
      }
      return left.displayName.localeCompare(right.displayName);
    })
    .map((row, index) => ({
      ...row,
      winRate: Number(row.winRate.toFixed(1)),
      avgR: Number(row.avgR.toFixed(2)),
      rank: index + 1,
    }));
}

export async function getLeaderboard(
  userId: string,
  timeframe: LeaderboardTimeframe = "all",
  options?: { includeAllMembers?: boolean },
): Promise<LeaderboardResult> {
  const includeAllMembers = options?.includeAllMembers ?? false;
  const tradeDateFilter =
    timeframe === "month"
      ? {
          tradeDate: {
            gte: startOfMonth(new Date()),
          },
        }
      : {};

  const users = await prisma.user.findMany({
    where: includeAllMembers
      ? undefined
      : {
          OR: [
            { leaderboardOptIn: true },
            { id: userId },
          ],
        },
    select: {
      id: true,
      name: true,
      avatarUrl: true,
      leaderboardOptIn: true,
      journalStreak: true,
      trades: {
        where: tradeDateFilter,
        select: {
          outcome: true,
          rrRatio: true,
        },
      },
    },
  });

  const rows = buildLeaderboardRows(users, includeAllMembers);
  const currentUser = rows.find((row) => row.userId === userId) ?? null;
  const currentUserBase = users.find((user) => user.id === userId) ?? null;
  const currentUserEligible =
    includeAllMembers
      ? currentUser !== null
      : currentUserBase !== null &&
        currentUserBase.leaderboardOptIn &&
        toClosedTrades(currentUserBase.trades).length >= MIN_TRADES;

  return {
    timeframe,
    top: rows,
    currentUser,
    currentUserEligible,
    includeAllMembers,
  };
}
