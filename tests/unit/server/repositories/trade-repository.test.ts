import { Prisma } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";
import { TradeRepository } from "@/server/repositories/trade-repository";

function makeLegacyTrade(overrides: Record<string, unknown> = {}) {
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
    notes: null,
    tradeDate: new Date("2025-01-15"),
    closedAt: new Date("2025-01-15"),
    month: "JAN_2025",
    createdAt: new Date("2025-01-15"),
    updatedAt: new Date("2025-01-15"),
    ...overrides,
  };
}

describe("TradeRepository.list", () => {
  it("falls back to a legacy-safe select when optional trade columns are missing", async () => {
    const missingColumnError = new Prisma.PrismaClientKnownRequestError(
      "The column does not exist on the current database schema.",
      {
        code: "P2022",
        clientVersion: "test",
      },
    );

    const findMany = vi
      .fn()
      .mockRejectedValueOnce(missingColumnError)
      .mockResolvedValueOnce([makeLegacyTrade()]);

    const repo = new TradeRepository({
      trade: { findMany },
    } as never);

    const result = await repo.list({
      userId: "user-1",
      tags: ["breakout"],
    });

    expect(findMany).toHaveBeenCalledTimes(2);
    expect(findMany.mock.calls[1]?.[0]?.where?.tags).toBeUndefined();
    expect(findMany.mock.calls[1]?.[0]?.select).toMatchObject({
      id: true,
      coin: true,
      outcome: true,
    });
    expect(result.hasNext).toBe(false);
    expect(result.nextCursor).toBeNull();
    expect(result.data[0]).toMatchObject({
      id: "trade-1",
      tags: [],
      chartImageUrl: null,
      emotionBefore: null,
      revenge: false,
      followedPlan: null,
    });
  });
});
