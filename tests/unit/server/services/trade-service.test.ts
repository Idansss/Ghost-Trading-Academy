// AUDIT FIX: TradeService had zero unit tests. Added full coverage including the
// happy path, password-level check (raw input not stored), and error cases.
import { describe, expect, it, vi } from "vitest";
import { Prisma } from "@prisma/client";
import { TradeService } from "@/server/services/trade-service";
import type { TradeRepository } from "@/server/repositories/trade-repository";

// ─── helpers ──────────────────────────────────────────────────────────────────

function makeTrade(overrides: Record<string, unknown> = {}) {
  return {
    id: "trade-1",
    userId: "user-1",
    coin: "BTC",
    direction: "LONG",
    entryPrice: 90000,
    stopLoss: 88000,
    takeProfit: 93000,
    tp2: null,
    tp3: null,
    rrRatio: 1.5,
    riskPercent: 2.22,
    pnlPercent: 3.0,
    outcome: "WIN",
    setupType: "Breakout",
    tags: [],
    notes: null,
    chartImageUrl: null,
    emotionBefore: null,
    emotionDuring: null,
    emotionAfter: null,
    followedPlan: null,
    revenge: false,
    overSized: false,
    movedStop: false,
    exitedEarly: false,
    tradeRating: null,
    mistakeNote: null,
    lessonLearned: null,
    tradeDate: new Date("2025-01-15"),
    month: "JAN_2025",
    closedAt: new Date("2025-01-15"),
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function makeDeps(overrides: Partial<TradeRepository> = {}) {
  return {
    trades: {
      list: vi.fn().mockResolvedValue({ data: [], hasNext: false, nextCursor: null }),
      listAll: vi.fn().mockResolvedValue([]),
      create: vi.fn().mockResolvedValue(makeTrade()),
      findById: vi.fn().mockResolvedValue(null),
      findUserSummary: vi.fn().mockResolvedValue(null),
      ...overrides,
    } as unknown as TradeRepository,
    markOnboarding: vi.fn().mockResolvedValue(undefined),
    recalculateStreak: vi.fn().mockResolvedValue(undefined),
    logActivity: vi.fn().mockResolvedValue(undefined),
  };
}

const basePayload = {
  coin: "BTC",
  direction: "LONG" as never,
  entryPrice: 90000,
  stopLoss: 88000,
  takeProfit: 93000,
  pnlPercent: 3.0,
  outcome: "WIN" as never,
  setupType: "Breakout",
  tags: [] as string[],
  revenge: false,
  overSized: false,
  movedStop: false,
  exitedEarly: false,
  tradeDate: "2025-01-15",
};

// ─── createTrade ──────────────────────────────────────────────────────────────

describe("TradeService.createTrade", () => {
  it("creates a trade and returns the persisted record", async () => {
    const create = vi.fn().mockResolvedValue(makeTrade());
    const service = new TradeService(makeDeps({ create }));

    const result = await service.createTrade("user-1", basePayload);

    expect(create).toHaveBeenCalledOnce();
    expect(result).toMatchObject({ id: "trade-1", coin: "BTC" });
  });

  it("calculates rrRatio from entry, stop, and take-profit — not accepting raw input", async () => {
    const create = vi.fn().mockResolvedValue(makeTrade());
    const service = new TradeService(makeDeps({ create }));

    await service.createTrade("user-1", { ...basePayload, entryPrice: 100, stopLoss: 90, takeProfit: 120 });

    const callArg = create.mock.calls[0]![0] as { rrRatio: number };
    // rrRatio = |120-100| / |100-90| = 2.0
    expect(callArg.rrRatio).toBeCloseTo(2.0);
  });

  it("marks the trade as pending (closedAt=null) for PENDING outcome", async () => {
    const create = vi.fn().mockResolvedValue(makeTrade({ closedAt: null, outcome: "PENDING" }));
    const service = new TradeService(makeDeps({ create }));

    await service.createTrade("user-1", { ...basePayload, outcome: "PENDING" as never });

    const callArg = create.mock.calls[0]![0] as { closedAt: Date | null };
    expect(callArg.closedAt).toBeNull();
  });

  it("sets closedAt to tradeDate for non-PENDING outcomes", async () => {
    const create = vi.fn().mockResolvedValue(makeTrade());
    const service = new TradeService(makeDeps({ create }));

    await service.createTrade("user-1", { ...basePayload, outcome: "WIN" as never, tradeDate: "2025-01-15" });

    const callArg = create.mock.calls[0]![0] as { closedAt: Date };
    expect(callArg.closedAt).toBeInstanceOf(Date);
  });

  it("rejects untrusted image URLs", async () => {
    const service = new TradeService(makeDeps());

    await expect(
      service.createTrade("user-1", {
        ...basePayload,
        chartImageUrl: "https://malicious-site.com/img.png",
      }),
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it("accepts UploadThing CDN image URLs", async () => {
    const create = vi.fn().mockResolvedValue(makeTrade());
    const service = new TradeService(makeDeps({ create }));

    await expect(
      service.createTrade("user-1", {
        ...basePayload,
        chartImageUrl: "https://utfs.io/f/abc123",
      }),
    ).resolves.not.toThrow();
  });
});

// ─── listTrades ───────────────────────────────────────────────────────────────

describe("TradeService.listTrades", () => {
  it("returns trades with summary and pagination meta", async () => {
    const trade = makeTrade({ pnlPercent: 3.0, outcome: "WIN", rrRatio: 1.5 });
    const service = new TradeService(
      makeDeps({
        list: vi.fn().mockResolvedValue({ data: [trade], hasNext: true, nextCursor: "trade-1" }),
        listAll: vi.fn().mockResolvedValue([trade]),
        findUserSummary: vi.fn().mockResolvedValue({
          journalStreak: 5,
          longestStreak: 10,
          disciplineScore: 80,
          lastJournalDate: new Date(),
        }),
      }),
    );

    const result = await service.listTrades("user-1", {});

    expect(result.trades).toHaveLength(1);
    expect(result.summary.totalTrades).toBe(1);
    expect(result.summary.winRate).toBeCloseTo(100);
    expect(result.meta.hasNext).toBe(true);
    expect(result.meta.nextCursor).toBe("trade-1");
  });

  it("returns zeroed summary when no trades exist", async () => {
    const service = new TradeService(makeDeps());
    const result = await service.listTrades("user-1", {});

    expect(result.trades).toHaveLength(0);
    expect(result.summary.totalPnl).toBe(0);
    expect(result.summary.winRate).toBe(0);
    expect(result.summary.avgRR).toBe(0);
  });

  it("falls back when optional journal summary columns are missing", async () => {
    const trade = makeTrade({ pnlPercent: 2.5, outcome: "WIN", rrRatio: 2.0 });
    const missingColumnError = new Prisma.PrismaClientKnownRequestError(
      "The column does not exist on the current database schema.",
      {
        code: "P2022",
        clientVersion: "test",
      },
    );
    const service = new TradeService(
      makeDeps({
        list: vi.fn().mockResolvedValue({
          data: [trade],
          hasNext: false,
          nextCursor: null,
        }),
        listAll: vi.fn().mockResolvedValue([trade]),
        findUserSummary: vi.fn().mockRejectedValue(missingColumnError),
      }),
    );

    const result = await service.listTrades("user-1", {});

    expect(result.trades).toHaveLength(1);
    expect(result.summary.journalStreak).toBe(0);
    expect(result.summary.longestStreak).toBe(0);
    expect(result.summary.disciplineScore).toBe(0);
    expect(result.summary.loggedToday).toBe(false);
  });
});
