import { startOfMonth } from "date-fns";
import { calculateAvgRR, calculateMonthlyPnL, calculateWinRate, getEquityCurve, getMonthlySnapshot } from "@/lib/calculations";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiError, getMonthKey } from "@/lib/utils";

export async function GET() {
  try {
    const user = await requireUser();
    const currentMonthKey = getMonthKey(new Date());

    const [monthTrades, allTrades, recentTrades, latestOutlook, activeSignals] =
      await Promise.all([
        prisma.trade.findMany({
          where: {
            userId: user.id,
            month: currentMonthKey,
          },
          orderBy: { tradeDate: "asc" },
        }),
        prisma.trade.findMany({
          where: { userId: user.id },
          orderBy: { tradeDate: "asc" },
        }),
        prisma.trade.findMany({
          where: { userId: user.id },
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
      ]);

    return Response.json({
      kpis: {
        totalPnl: calculateMonthlyPnL(monthTrades),
        winRate: calculateWinRate(monthTrades),
        avgRR: calculateAvgRR(monthTrades),
        totalTrades: monthTrades.length,
      },
      equityCurve: getEquityCurve(
        monthTrades.filter((trade) => trade.tradeDate >= startOfMonth(new Date())),
        user.accountBalance,
      ),
      monthlySnapshot: getMonthlySnapshot(allTrades),
      recentTrades,
      latestOutlook: user.role === "MEMBER" ? null : latestOutlook,
      activeSignals: user.role === "MEMBER" ? 0 : activeSignals,
    });
  } catch {
    return apiError("Unable to load dashboard data.", 500);
  }
}
