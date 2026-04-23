// AUDIT FIX: Business logic for trades was embedded directly in the route handler.
// Moved to this service so controllers stay thin and logic is independently testable.
import { isSameDay } from "date-fns";
import { Prisma } from "@prisma/client";
import type { Direction, TradeOutcome } from "@prisma/client";
import {
  calculateAvgRR,
  calculateDailyLoss,
  calculateMonthlyPnL,
  calculateRR,
  calculateRiskPercent,
  calculateWinRate,
  getMonthlySnapshot,
} from "@/lib/calculations";
import { markOnboardingStepComplete } from "@/lib/onboarding";
import { assertTrustedImageUrl } from "@/lib/sanitize";
import { logUserActivity } from "@/lib/activity";
import { recalculateUserStreak } from "@/lib/streak";
import { getMonthKey } from "@/lib/utils";
import logger from "@/server/core/logger";
import {
  type TradeListFilters,
  type TradeRepository,
  tradeRepository,
} from "@/server/repositories/trade-repository";

type TradeServiceDependencies = {
  trades: TradeRepository;
  markOnboarding: typeof markOnboardingStepComplete;
  recalculateStreak: typeof recalculateUserStreak;
  logActivity: typeof logUserActivity;
};

type TradeUserSummary = Awaited<
  ReturnType<TradeRepository["findUserSummary"]>
>;

const tradeSummaryFallback: NonNullable<TradeUserSummary> = {
  journalStreak: 0,
  longestStreak: 0,
  disciplineScore: 0,
  lastJournalDate: null,
};

function isOptionalTradeSummarySchemaError(
  error: unknown,
): error is Prisma.PrismaClientKnownRequestError {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    (error.code === "P2021" || error.code === "P2022")
  );
}

async function getOptionalTradeSummary(
  run: () => Promise<TradeUserSummary>,
): Promise<TradeUserSummary> {
  try {
    return await run();
  } catch (error) {
    if (isOptionalTradeSummarySchemaError(error)) {
      logger.warn({
        type: "trade_summary_optional_schema_fallback",
        code: error.code,
        message: error.message,
      });
      return tradeSummaryFallback;
    }

    throw error;
  }
}

export type TradeCreatePayload = {
  coin: string;
  direction: Direction;
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  tp2?: number | null;
  tp3?: number | null;
  pnlPercent: number;
  outcome: TradeOutcome;
  setupType: string;
  tags: string[];
  notes?: string | null;
  chartImageUrl?: string | null;
  emotionBefore?: string | null;
  emotionAfter?: string | null;
  emotionDuring?: string | null;
  followedPlan?: boolean | null;
  revenge?: boolean;
  overSized?: boolean;
  movedStop?: boolean;
  exitedEarly?: boolean;
  tradeRating?: number | null;
  mistakeNote?: string | null;
  lessonLearned?: string | null;
  tradeDate: string;
};

export class TradeService {
  constructor(private readonly deps: TradeServiceDependencies) {}

  async listTrades(
    userId: string,
    filters: TradeListFilters & { cursor?: string; limit?: number },
  ) {
    const [
      { data: trades, hasNext, nextCursor },
      allTrades,
      userSummary,
    ] = await Promise.all([
      this.deps.trades.list({
        userId,
        ...filters,
      }),
      this.deps.trades.listAll(userId),
      getOptionalTradeSummary(() => this.deps.trades.findUserSummary(userId)),
    ]);

    const tradingDays = new Set(
      trades.map((t) => new Date(t.tradeDate).toDateString()),
    ).size;

    return {
      trades,
      summary: {
        totalPnl: calculateMonthlyPnL(trades),
        winRate: calculateWinRate(trades),
        avgRR: calculateAvgRR(trades),
        totalTrades: trades.length,
        bestTrade: trades.length
          ? Math.max(...trades.map((t) => t.pnlPercent))
          : 0,
        worstTrade: trades.length
          ? Math.min(...trades.map((t) => t.pnlPercent))
          : 0,
        dailyLoss: calculateDailyLoss(trades, tradingDays),
        snapshot: getMonthlySnapshot(allTrades),
        journalStreak: userSummary?.journalStreak ?? 0,
        longestStreak: userSummary?.longestStreak ?? 0,
        disciplineScore: userSummary?.disciplineScore ?? 0,
        loggedToday: userSummary?.lastJournalDate
          ? isSameDay(new Date(userSummary.lastJournalDate), new Date())
          : false,
      },
      meta: {
        hasNext,
        nextCursor,
      },
    };
  }

  async createTrade(userId: string, input: TradeCreatePayload) {
    // AUDIT FIX: Image URL validation is now enforced in the service layer so
    // it applies regardless of which route or client triggers trade creation.
    assertTrustedImageUrl(input.chartImageUrl ?? null);

    const tradeDate = new Date(input.tradeDate);

    const trade = await this.deps.trades.create({
      userId,
      coin: input.coin,
      direction: input.direction,
      entryPrice: input.entryPrice,
      stopLoss: input.stopLoss,
      takeProfit: input.takeProfit,
      tp2: input.tp2 ?? null,
      tp3: input.tp3 ?? null,
      rrRatio: calculateRR(input.entryPrice, input.stopLoss, input.takeProfit),
      riskPercent: calculateRiskPercent(input.entryPrice, input.stopLoss),
      pnlPercent: input.pnlPercent,
      outcome: input.outcome,
      setupType: input.setupType,
      tags: input.tags,
      notes: input.notes ?? null,
      chartImageUrl: input.chartImageUrl ?? null,
      // AUDIT FIX: Emotion enums are passed through; Zod + Prisma enum validation
      // already ensures only valid values reach here.
      emotionBefore: (input.emotionBefore as never) ?? null,
      emotionDuring: (input.emotionDuring as never) ?? null,
      emotionAfter: (input.emotionAfter as never) ?? null,
      followedPlan: input.followedPlan ?? null,
      revenge: input.revenge ?? false,
      overSized: input.overSized ?? false,
      movedStop: input.movedStop ?? false,
      exitedEarly: input.exitedEarly ?? false,
      tradeRating: input.tradeRating ?? null,
      mistakeNote: input.mistakeNote ?? null,
      lessonLearned: input.lessonLearned ?? null,
      tradeDate,
      month: getMonthKey(tradeDate),
      closedAt: input.outcome === "PENDING" ? null : tradeDate,
    });

    // AUDIT FIX: Side-effects run concurrently after the trade is persisted.
    // Failures in onboarding/streak/activity tracking are non-fatal and do
    // NOT roll back the trade creation.
    await Promise.allSettled([
      this.deps.markOnboarding(userId, "FIRST_TRADE_LOGGED"),
      this.deps.recalculateStreak(userId, tradeDate),
      this.deps.logActivity(userId, "TRADE_LOGGED", tradeDate),
    ]);

    return trade;
  }
}

export const tradeService = new TradeService({
  trades: tradeRepository,
  markOnboarding: markOnboardingStepComplete,
  recalculateStreak: recalculateUserStreak,
  logActivity: logUserActivity,
});
