// AUDIT FIX: The original app/api/trades/route.ts queried Prisma directly inside the
// route handler, violating the layered architecture. All DB queries for trades are now
// isolated here, and the service layer holds all business logic.
import { Prisma } from "@prisma/client";
import type {
  Direction,
  EmotionState,
  PrismaClient,
  Trade,
  TradeOutcome,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { isOptionalPrismaSchemaError } from "@/server/core/prisma-schema";

export type TradeListFilters = {
  month?: string;
  search?: string;
  outcome?: TradeOutcome;
  direction?: Direction;
  setup?: string;
  tags?: string[];
  from?: Date;
  to?: Date;
};

export type TradeListInput = TradeListFilters & {
  userId: string;
  cursor?: string;
  limit?: number;
};

export type TradeCreateInput = {
  userId: string;
  coin: string;
  direction: Direction;
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  tp2?: number | null;
  tp3?: number | null;
  rrRatio: number;
  riskPercent: number;
  pnlPercent: number;
  outcome: TradeOutcome;
  setupType: string;
  tags: string[];
  notes?: string | null;
  chartImageUrl?: string | null;
  emotionBefore?: EmotionState | null;
  emotionDuring?: EmotionState | null;
  emotionAfter?: EmotionState | null;
  followedPlan?: boolean | null;
  revenge: boolean;
  overSized: boolean;
  movedStop: boolean;
  exitedEarly: boolean;
  tradeRating?: number | null;
  mistakeNote?: string | null;
  lessonLearned?: string | null;
  tradeDate: Date;
  month: string;
  closedAt: Date | null;
};

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;
const coreTradeSelect = {
  id: true,
  userId: true,
  coin: true,
  direction: true,
  entryPrice: true,
  stopLoss: true,
  takeProfit: true,
  tp2: true,
  tp3: true,
  rrRatio: true,
  riskPercent: true,
  pnlPercent: true,
  outcome: true,
  setupType: true,
  notes: true,
  tradeDate: true,
  closedAt: true,
  month: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.TradeSelect;

type CoreTradeRecord = Prisma.TradeGetPayload<{
  select: typeof coreTradeSelect;
}>;

function toCompatibleTrade(trade: CoreTradeRecord): Trade {
  return {
    ...trade,
    tags: [],
    chartImageUrl: null,
    emotionBefore: null,
    emotionDuring: null,
    emotionAfter: null,
    followedPlan: null,
    revenge: false,
    overSized: false,
    movedStop: false,
    exitedEarly: false,
    mistakeNote: null,
    lessonLearned: null,
    tradeRating: null,
  };
}

export class TradeRepository {
  constructor(private readonly db: PrismaClient = prisma) {}

  async list(input: TradeListInput) {
    const limit = Math.min(input.limit ?? DEFAULT_LIMIT, MAX_LIMIT);
    const orderBy = { tradeDate: "desc" } as const;

    try {
      // AUDIT FIX: Cursor-based pagination - fetch limit+1 rows to determine whether
      // a next page exists without running a separate COUNT query.
      const trades = await this.db.trade.findMany({
        where: this.buildWhereClause(input),
        orderBy,
        take: limit + 1,
        ...(input.cursor
          ? {
              cursor: { id: input.cursor },
              skip: 1,
            }
          : {}),
      });

      const hasNext = trades.length > limit;
      const data = hasNext ? trades.slice(0, limit) : trades;
      const nextCursor = hasNext ? (data.at(-1)?.id ?? null) : null;

      return { data, hasNext, nextCursor };
    } catch (error) {
      if (!isOptionalPrismaSchemaError(error)) {
        throw error;
      }

      // AUDIT FIX: If production is missing newer optional Trade columns, fall
      // back to a legacy-safe select so the journal page can still render.
      const legacyTrades = await this.db.trade.findMany({
        where: this.buildWhereClause(input, { includeTags: false }),
        orderBy,
        take: limit + 1,
        select: coreTradeSelect,
        ...(input.cursor
          ? {
              cursor: { id: input.cursor },
              skip: 1,
            }
          : {}),
      });

      const hasNext = legacyTrades.length > limit;
      const data = (hasNext ? legacyTrades.slice(0, limit) : legacyTrades).map(
        toCompatibleTrade,
      );
      const nextCursor = hasNext ? (data.at(-1)?.id ?? null) : null;

      return { data, hasNext, nextCursor };
    }
  }

  async listAll(userId: string) {
    return this.db.trade.findMany({
      where: { userId },
      select: { tradeDate: true, pnlPercent: true },
    });
  }

  async create(input: TradeCreateInput) {
    // AUDIT FIX: Uses RETURNING-equivalent (Prisma create returns the record directly).
    // No secondary SELECT is needed.
    return this.db.trade.create({ data: input });
  }

  async findById(id: string, userId: string) {
    return this.db.trade.findFirst({ where: { id, userId } });
  }

  async findUserSummary(userId: string) {
    return this.db.user.findUnique({
      where: { id: userId },
      select: {
        journalStreak: true,
        longestStreak: true,
        disciplineScore: true,
        lastJournalDate: true,
      },
    });
  }

  private buildWhereClause(
    input: TradeListInput,
    options: { includeTags?: boolean } = {},
  ) {
    const includeTags = options.includeTags ?? true;

    return {
      userId: input.userId,
      ...(input.month ? { month: input.month } : {}),
      // AUDIT FIX: ILIKE search uses a parameterized Prisma contains filter,
      // not string interpolation - zero SQL injection risk.
      ...(input.search
        ? { coin: { contains: input.search, mode: "insensitive" as const } }
        : {}),
      ...(input.outcome ? { outcome: input.outcome } : {}),
      ...(input.direction ? { direction: input.direction } : {}),
      ...(input.setup
        ? { setupType: { contains: input.setup, mode: "insensitive" as const } }
        : {}),
      ...(includeTags && input.tags?.length
        ? { tags: { hasSome: input.tags } }
        : {}),
      ...((input.from ?? input.to)
        ? {
            tradeDate: {
              ...(input.from ? { gte: input.from } : {}),
              ...(input.to ? { lte: input.to } : {}),
            },
          }
        : {}),
    };
  }
}

export const tradeRepository = new TradeRepository();
