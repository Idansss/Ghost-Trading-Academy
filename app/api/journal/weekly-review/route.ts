import { endOfWeek, startOfWeek, subWeeks } from "date-fns";
import { requireUser } from "@/lib/auth";
import { sendNotification } from "@/lib/notify";
import { prisma } from "@/lib/prisma";
import { apiError, safeJson } from "@/lib/utils";
import { weeklyReviewSchema } from "@/lib/validators";

// AUDIT FIX: All authenticated API routes must opt out of static rendering
export const dynamic = "force-dynamic";

function getPreviousWeekRange() {
  const lastWeekAnchor = subWeeks(new Date(), 1);
  return {
    weekStartDate: startOfWeek(lastWeekAnchor, { weekStartsOn: 1 }),
    weekEndDate: endOfWeek(lastWeekAnchor, { weekStartsOn: 1 }),
  };
}

function getDisciplineScore(
  trades: Array<{ followedPlan: boolean | null; revenge: boolean; overSized: boolean; movedStop: boolean; exitedEarly: boolean }>,
) {
  if (!trades.length) return 0;
  const score = trades
    .map((trade) => {
      let value = 100;
      if (trade.followedPlan === false) value -= 20;
      if (trade.revenge) value -= 20;
      if (trade.overSized) value -= 15;
      if (trade.movedStop) value -= 15;
      if (trade.exitedEarly) value -= 10;
      return Math.max(0, value);
    })
    .reduce((sum, value) => sum + value, 0);
  return Math.round(score / trades.length);
}

export async function GET() {
  try {
    const user = await requireUser();
    const { weekStartDate, weekEndDate } = getPreviousWeekRange();

    const [trades, existingReview] = await Promise.all([
      prisma.trade.findMany({
        where: {
          userId: user.id,
          tradeDate: {
            gte: weekStartDate,
            lte: weekEndDate,
          },
        },
        orderBy: { pnlPercent: "desc" },
      }),
      prisma.weeklyReview.findUnique({
        where: {
          userId_weekStartDate: {
            userId: user.id,
            weekStartDate,
          },
        },
      }),
    ]);

    const totalTrades = trades.length;
    const wins = trades.filter((trade) => trade.outcome === "WIN").length;
    const totalPnl = trades.reduce((sum, trade) => sum + trade.pnlPercent, 0);
    const totalR = trades.reduce((sum, trade) => sum + trade.rrRatio, 0);
    const bestTrades = [...trades].sort((a, b) => b.pnlPercent - a.pnlPercent).slice(0, 3);
    const worstTrades = [...trades].sort((a, b) => a.pnlPercent - b.pnlPercent).slice(0, 3);
    const disciplineScore = getDisciplineScore(trades);
    const winRate = totalTrades ? (wins / totalTrades) * 100 : 0;

    if (new Date().getDay() === 1) {
      const today = new Date();
      const dayStart = new Date(today);
      dayStart.setHours(0, 0, 0, 0);
      const existingToday = await prisma.notification.findFirst({
        where: {
          userId: user.id,
          type: "WEEKLY_REVIEW_READY",
          createdAt: { gte: dayStart },
        },
        select: { id: true },
      });
      if (!existingToday) {
        await sendNotification(user.id, "WEEKLY_REVIEW_READY", {
          title: "Your week in review is ready",
          message: `Your week in review is ready — ${totalTrades} trades, ${winRate.toFixed(0)}% win rate. Complete your reflection.`,
          link: "/journal/weekly-review",
        });
      }
    }

    return Response.json({
      weekStartDate,
      weekEndDate,
      stats: {
        totalTrades,
        winRate,
        totalPnl,
        totalR,
        disciplineScore,
      },
      bestTrades,
      worstTrades,
      existingReview,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return apiError("Unauthorized.", 401);
    }
    return apiError("Unable to load weekly review.", 500);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = await safeJson<unknown>(request);
    const parsed = weeklyReviewSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { error: "Validation failed.", details: parsed.error.flatten() },
        { status: 422 },
      );
    }

    const weekStartDate = new Date(parsed.data.weekStartDate);
    const weekEndDate = endOfWeek(weekStartDate, { weekStartsOn: 1 });
    const trades = await prisma.trade.findMany({
      where: {
        userId: user.id,
        tradeDate: {
          gte: weekStartDate,
          lte: weekEndDate,
        },
      },
    });

    const totalTrades = trades.length;
    const wins = trades.filter((trade) => trade.outcome === "WIN").length;
    const totalPnl = trades.reduce((sum, trade) => sum + trade.pnlPercent, 0);
    const totalR = trades.reduce((sum, trade) => sum + trade.rrRatio, 0);

    const review = await prisma.weeklyReview.upsert({
      where: {
        userId_weekStartDate: {
          userId: user.id,
          weekStartDate,
        },
      },
      update: {
        totalTrades,
        winRate: totalTrades ? (wins / totalTrades) * 100 : 0,
        totalPnl,
        totalR,
        bestTrade: parsed.data.bestTrade ?? null,
        worstTrade: parsed.data.worstTrade ?? null,
        whatWorked: parsed.data.whatWorked,
        whatDidntWork: parsed.data.whatDidntWork,
        nextWeekFocus: parsed.data.nextWeekFocus,
        disciplineScore: getDisciplineScore(trades),
        overallRating: parsed.data.overallRating,
      },
      create: {
        userId: user.id,
        weekStartDate,
        totalTrades,
        winRate: totalTrades ? (wins / totalTrades) * 100 : 0,
        totalPnl,
        totalR,
        bestTrade: parsed.data.bestTrade ?? null,
        worstTrade: parsed.data.worstTrade ?? null,
        whatWorked: parsed.data.whatWorked,
        whatDidntWork: parsed.data.whatDidntWork,
        nextWeekFocus: parsed.data.nextWeekFocus,
        disciplineScore: getDisciplineScore(trades),
        overallRating: parsed.data.overallRating,
      },
    });

    return Response.json(review);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return apiError("Unauthorized.", 401);
    }
    return apiError("Unable to save weekly review.", 500);
  }
}
