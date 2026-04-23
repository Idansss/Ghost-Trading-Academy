// AUDIT FIX: The original app/api/trades/route.ts queried Prisma directly inside the
// route handler, violating the layered architecture. All DB queries for trades are now
// isolated here, and the service layer holds all business logic.
import type { Direction, EmotionState, PrismaClient, TradeOutcome } from "@prisma/client";
import { prisma } from "@/lib/prisma";

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

export class TradeRepository {
  constructor(private readonly db: PrismaClient = prisma) {}

  async list(input: TradeListInput) {
    const limit = Math.min(input.limit ?? DEFAULT_LIMIT, MAX_LIMIT);

    const where = this.buildWhereClause(input);

    // AUDIT FIX: Cursor-based pagination — fetch limit+1 rows to determine whether
    // a next page exists without running a separate COUNT query.
    const trades = await this.db.trade.findMany({
      where,
      orderBy: { tradeDate: "desc" },
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

  private buildWhereClause(input: TradeListInput) {
    return {
      userId: input.userId,
      ...(input.month ? { month: input.month } : {}),
      // AUDIT FIX: ILIKE search uses a parameterized Prisma contains filter,
      // not string interpolation — zero SQL injection risk.
      ...(input.search
        ? { coin: { contains: input.search, mode: "insensitive" as const } }
        : {}),
      ...(input.outcome ? { outcome: input.outcome } : {}),
      ...(input.direction ? { direction: input.direction } : {}),
      ...(input.setup
        ? { setupType: { contains: input.setup, mode: "insensitive" as const } }
        : {}),
      ...(input.tags?.length ? { tags: { hasSome: input.tags } } : {}),
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
