import {
  differenceInCalendarDays,
  eachDayOfInterval,
  endOfDay,
  endOfWeek,
  format,
  isSameDay,
  startOfDay,
  startOfWeek,
  subDays,
} from "date-fns";
import { prisma } from "@/lib/prisma";

type HeatmapCell = {
  date: string;
  label: string;
  hasActivity: boolean;
  count: number;
  isToday: boolean;
};

export async function recalculateUserStreak(userId: string, tradeDate: Date) {
  const normalizedTradeDate = startOfDay(tradeDate);
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      journalStreak: true,
      longestStreak: true,
      lastJournalDate: true,
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  const lastJournalDate = user.lastJournalDate ? startOfDay(user.lastJournalDate) : null;
  let journalStreak = user.journalStreak;

  if (!lastJournalDate) {
    journalStreak = 1;
  } else if (isSameDay(lastJournalDate, normalizedTradeDate)) {
    journalStreak = Math.max(user.journalStreak, 1);
  } else {
    const dayDifference = differenceInCalendarDays(normalizedTradeDate, lastJournalDate);
    if (dayDifference === 1) {
      journalStreak = user.journalStreak + 1;
    } else if (dayDifference > 1) {
      journalStreak = 1;
    }
  }

  const longestStreak = Math.max(user.longestStreak, journalStreak);
  const disciplineScore = await calculateWeeklyDisciplineScore(userId);

  return prisma.user.update({
    where: { id: userId },
    data: {
      journalStreak,
      longestStreak,
      lastJournalDate: normalizedTradeDate,
      disciplineScore,
    },
    select: {
      journalStreak: true,
      longestStreak: true,
      lastJournalDate: true,
      disciplineScore: true,
    },
  });
}

export async function refreshUserDisciplineScore(userId: string) {
  const disciplineScore = await calculateWeeklyDisciplineScore(userId);

  return prisma.user.update({
    where: { id: userId },
    data: { disciplineScore },
    select: {
      journalStreak: true,
      longestStreak: true,
      lastJournalDate: true,
      disciplineScore: true,
    },
  });
}

export async function calculateWeeklyDisciplineScore(userId: string) {
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });
  const todayStart = startOfDay(new Date());
  const todayEnd = endOfDay(new Date());

  const [tradeCount, signalReviewCount, resourceCompletionCount, hasDailyPlan] = await Promise.all([
    prisma.trade.count({
      where: {
        userId,
        tradeDate: { gte: weekStart, lte: weekEnd },
      },
    }),
    prisma.signalView.count({
      where: {
        userId,
        viewedAt: { gte: weekStart, lte: weekEnd },
      },
    }),
    prisma.resourceCompletion.count({
      where: {
        userId,
        completedAt: { gte: weekStart, lte: weekEnd },
      },
    }),
    prisma.dailyOutlook.count({
      where: {
        date: { gte: todayStart, lte: todayEnd },
      },
    }),
  ]);

  const tradesScore = Math.min(35, tradeCount * 7);
  const signalsScore = Math.min(25, signalReviewCount * 5);
  const resourcesScore = Math.min(20, resourceCompletionCount * 10);
  const planScore = hasDailyPlan > 0 ? 20 : 0;

  return Number((tradesScore + signalsScore + resourcesScore + planScore).toFixed(1));
}

export async function getSevenDayJournalHeatmap(userId: string): Promise<HeatmapCell[]> {
  const today = startOfDay(new Date());
  const startDate = subDays(today, 6);

  const trades = await prisma.trade.findMany({
    where: {
      userId,
      tradeDate: {
        gte: startDate,
        lte: endOfDay(today),
      },
    },
    select: {
      tradeDate: true,
    },
  });

  const counts = trades.reduce<Record<string, number>>((accumulator, trade) => {
    const key = format(startOfDay(trade.tradeDate), "yyyy-MM-dd");
    accumulator[key] = (accumulator[key] ?? 0) + 1;
    return accumulator;
  }, {});

  return eachDayOfInterval({ start: startDate, end: today }).map((date) => {
    const key = format(date, "yyyy-MM-dd");
    const count = counts[key] ?? 0;

    return {
      date: key,
      label: format(date, "EEE"),
      hasActivity: count > 0,
      count,
      isToday: isSameDay(date, today),
    };
  });
}
