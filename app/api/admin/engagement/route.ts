import { subDays, format, startOfDay } from "date-fns";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiError } from "@/lib/utils";

// AUDIT FIX: All authenticated API routes must opt out of static rendering
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireAdmin();
    const now = new Date();
    const days = Array.from({ length: 30 }).map((_, index) => startOfDay(subDays(now, 29 - index)));

    const [activities, topMembers, topSignalViews, resourceCompletions, users, onboardingCompleted, firstTradeUsers, firstSignalTakenUsers, firstResourceUsers] =
      await Promise.all([
        prisma.userActivity.findMany({
          where: { date: { gte: days[0] } },
          select: { userId: true, date: true },
        }),
        prisma.user.findMany({
          select: {
            id: true,
            name: true,
            _count: { select: { trades: true } },
          },
          orderBy: { trades: { _count: "desc" } },
          take: 10,
        }),
        prisma.signal.findMany({
          select: {
            id: true,
            coin: true,
            _count: { select: { viewedBy: true } },
          },
          orderBy: { viewedBy: { _count: "desc" } },
          take: 10,
        }),
        prisma.resource.findMany({
          select: {
            id: true,
            title: true,
            _count: { select: { completions: true } },
          },
          orderBy: { completions: { _count: "desc" } },
          take: 10,
        }),
        prisma.user.findMany({
          where: { role: { in: ["MEMBER", "PREMIUM"] } },
          select: {
            id: true,
            name: true,
            email: true,
            updatedAt: true,
            activity: {
              orderBy: { createdAt: "desc" },
              take: 1,
              select: { createdAt: true },
            },
          },
        }),
        prisma.user.count({ where: { onboardingCompleted: true } }),
        prisma.trade.findMany({ distinct: ["userId"], select: { userId: true } }),
        prisma.signalTaken.findMany({ distinct: ["userId"], select: { userId: true } }),
        prisma.resourceCompletion.findMany({ distinct: ["userId"], select: { userId: true } }),
      ]);

    const dauChart = days.map((day) => {
      const key = day.toISOString().slice(0, 10);
      const activeUsers = new Set(
        activities
          .filter((entry) => entry.date.toISOString().slice(0, 10) === key)
          .map((entry) => entry.userId),
      );
      return { date: format(day, "yyyy-MM-dd"), users: activeUsers.size };
    });

    const firstTradeUserIds = new Set(firstTradeUsers.map((entry) => entry.userId));
    const firstSignalUserIds = new Set(firstSignalTakenUsers.map((entry) => entry.userId));
    const firstResourceUserIds = new Set(firstResourceUsers.map((entry) => entry.userId));

    const sevenDaysAgo = subDays(now, 7);
    const atRiskMembers = users
      .map((user) => {
        const lastActivity = user.activity[0]?.createdAt ?? user.updatedAt;
        return { ...user, lastActivity };
      })
      .filter((user) => user.lastActivity < sevenDaysAgo)
      .slice(0, 50);

    return Response.json({
      dauChart,
      topActiveMembers: topMembers.map((member) => ({
        id: member.id,
        name: member.name,
        tradeCount: member._count.trades,
      })),
      topViewedSignals: topSignalViews.map((signal) => ({
        id: signal.id,
        coin: signal.coin,
        views: signal._count.viewedBy,
      })),
      mostCompletedResources: resourceCompletions.map((resource) => ({
        id: resource.id,
        title: resource.title,
        completions: resource._count.completions,
      })),
      funnel: {
        registered: users.length,
        onboardingCompleted,
        firstTrade: firstTradeUserIds.size,
        firstSignalTaken: firstSignalUserIds.size,
        firstResourceCompleted: firstResourceUserIds.size,
      },
      atRiskMembers,
    });
  } catch (error) {
    console.error(error);
    return apiError("Unable to load engagement metrics.", 500);
  }
}
