import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiError, getMonthKey } from "@/lib/utils";
import { subDays, startOfDay } from "date-fns";

// AUDIT FIX: All authenticated API routes must opt out of static rendering
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireAdmin();
    const month = getMonthKey(new Date());
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const weekStart = subDays(now, 7);
    const thirtyDaysAgo = subDays(now, 30);

    const [
      totalMembers,
      totalPremiumUsers,
      totalSignalsThisMonth,
      totalTradesLogged,
      recentMembers,
      recentSignals,
      recentWins,
      signalsThisWeek,
      memberSignupDays,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: "PREMIUM" } }),
      prisma.signal.count({ where: { postedAt: { gte: monthStart } } }),
      prisma.trade.count({ where: { month } }),
      prisma.user.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        select: { id: true, name: true, email: true, createdAt: true, role: true },
      }),
      prisma.signal.findMany({
        orderBy: { postedAt: "desc" },
        take: 5,
        select: { id: true, coin: true, direction: true, status: true, postedAt: true, rrRatio: true },
      }),
      prisma.memberWin.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        include: { user: { select: { name: true } } },
      }),
      prisma.signal.findMany({
        where: { postedAt: { gte: weekStart } },
        select: { id: true, coin: true, direction: true, status: true, rrRatio: true, postedAt: true },
        orderBy: { postedAt: "desc" },
      }),
      prisma.user.findMany({
        where: { createdAt: { gte: thirtyDaysAgo } },
        select: { createdAt: true },
        orderBy: { createdAt: "asc" },
      }),
    ]);

    // Build signup chart: signups per day for last 30 days
    const signupMap = new Map<string, number>();
    for (let i = 0; i < 30; i++) {
      const d = subDays(now, 29 - i);
      signupMap.set(startOfDay(d).toISOString().slice(0, 10), 0);
    }
    for (const u of memberSignupDays) {
      const key = startOfDay(u.createdAt).toISOString().slice(0, 10);
      if (signupMap.has(key)) {
        signupMap.set(key, (signupMap.get(key) ?? 0) + 1);
      }
    }
    const signupChart = Array.from(signupMap.entries()).map(([date, count]) => ({ date, count }));

    // Build activity feed (most recent 10 actions across members, signals, wins)
    type ActivityItem = { type: string; label: string; time: Date };
    const activities: ActivityItem[] = [
      ...recentMembers.slice(0, 3).map((m) => ({
        type: "member",
        label: `${m.name} joined`,
        time: m.createdAt,
      })),
      ...recentSignals.slice(0, 4).map((s) => ({
        type: "signal",
        label: `Signal posted: ${s.coin} ${s.direction}`,
        time: s.postedAt,
      })),
      ...recentWins.slice(0, 3).map((w) => ({
        type: "win",
        label: `${w.user.name} shared a win`,
        time: w.createdAt,
      })),
    ];
    activities.sort((a, b) => b.time.getTime() - a.time.getTime());
    const activityFeed = activities.slice(0, 10).map((a) => ({
      ...a,
      time: a.time.toISOString(),
    }));

    return Response.json({
      totalMembers,
      totalPremiumUsers,
      totalSignalsThisMonth,
      totalTradesLogged,
      activityFeed,
      signupChart,
      signalsThisWeek: signalsThisWeek.map((s) => ({
        ...s,
        postedAt: s.postedAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error(error);
    return apiError("Unable to load admin overview.", 500);
  }
}
