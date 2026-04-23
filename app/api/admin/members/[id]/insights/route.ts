import { startOfWeek, subWeeks } from "date-fns";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiError } from "@/lib/utils";

// AUDIT FIX: All authenticated API routes must opt out of static rendering
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } },
) {
  try {
    await requireAdmin();
    const userId = params.id;
    const [user, trades, signalTaken, signalViews, resourcesCompleted, coursesCompleted, totalCourses, recentActivity] =
      await Promise.all([
        prisma.user.findUnique({
          where: { id: userId },
          select: {
            id: true,
            name: true,
            email: true,
            onboardingCompleted: true,
            emailSignalAlerts: true,
            pushPlayerId: true,
            createdAt: true,
            lastJournalDate: true,
          },
        }),
        prisma.trade.findMany({
          where: { userId },
          orderBy: { tradeDate: "desc" },
        }),
        prisma.signalTaken.findMany({
          where: { userId },
          include: { signal: { select: { id: true, coin: true, direction: true } } },
        }),
        prisma.signalView.count({ where: { userId } }),
        prisma.resourceCompletion.count({ where: { userId } }),
        prisma.courseEnrollment.count({
          where: { userId, completedAt: { not: null } },
        }),
        prisma.course.count(),
        prisma.userActivity.findFirst({
          where: { userId },
          orderBy: { createdAt: "desc" },
        }),
      ]);

    if (!user) return apiError("Member not found.", 404);

    const wins = trades.filter((trade) => trade.outcome === "WIN").length;
    const winRate = trades.length ? (wins / trades.length) * 100 : 0;
    const totalR = trades.reduce((sum, trade) => sum + trade.rrRatio, 0);

    let currentStreak = 0;
    for (const trade of trades) {
      if (trade.outcome === "WIN") {
        currentStreak += 1;
      } else {
        break;
      }
    }

    const weeklyScores = Array.from({ length: 4 }).map((_, index) => {
      const start = startOfWeek(subWeeks(new Date(), 3 - index), { weekStartsOn: 1 });
      const end = startOfWeek(subWeeks(new Date(), 2 - index), { weekStartsOn: 1 });
      const weekTrades = trades.filter(
        (trade) => trade.tradeDate >= start && trade.tradeDate < end,
      );
      const score = weekTrades.length
        ? weekTrades
            .map((trade) => {
              let points = 100;
              if (trade.followedPlan === false) points -= 20;
              if (trade.revenge) points -= 20;
              if (trade.overSized) points -= 15;
              if (trade.movedStop) points -= 15;
              if (trade.exitedEarly) points -= 10;
              return Math.max(0, points);
            })
            .reduce((sum, value) => sum + value, 0) / weekTrades.length
        : 0;
      return { weekStart: start.toISOString(), score: Math.round(score) };
    });

    return Response.json({
      member: {
        id: user.id,
        name: user.name,
        email: user.email,
        onboardingCompleted: user.onboardingCompleted,
        emailAlertsEnabled: user.emailSignalAlerts,
        pushEnabled: Boolean(user.pushPlayerId),
      },
      stats: {
        totalTrades: trades.length,
        winRate,
        totalR,
        currentStreak,
        lastActiveDate: recentActivity?.createdAt ?? user.lastJournalDate ?? user.createdAt,
        signalTakenCount: signalTaken.length,
        signalTaken: signalTaken.map((entry) => entry.signal),
        signalViewCount: signalViews,
        resourcesCompleted,
        courseProgress: {
          completed: coursesCompleted,
          total: totalCourses,
        },
        psychologyTrend: weeklyScores,
      },
    });
  } catch (error) {
    console.error(error);
    return apiError("Unable to load member insights.", 500);
  }
}
