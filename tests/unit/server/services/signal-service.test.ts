// AUDIT FIX: logUserActivity calls Prisma directly (not injected), so we mock
// the module at the boundary to keep unit tests free of real DB connections.
import { describe, expect, it, vi } from "vitest";
import { AppError } from "@/server/core/app-error";
import { SignalService } from "@/server/services/signal-service";

vi.mock("@/lib/activity", () => ({
  logUserActivity: vi.fn().mockResolvedValue(undefined),
}));

// ─── helpers ──────────────────────────────────────────────────────────────────

function makeSignal(overrides: Record<string, unknown> = {}) {
  return {
    id: "signal-1",
    coin: "BTC",
    direction: "LONG",
    entryZone: "90000-91000",
    stopLoss: "88000",
    tp1: "93000",
    tp2: "95000",
    tp3: "98000",
    riskLevel: "MEDIUM",
    timeframe: "4H",
    rrRatio: 2.5,
    reasoning: "<p>Strong support</p>",
    chartImageUrl: null,
    status: "ACTIVE",
    isPremiumOnly: true,
    outcomeNote: null,
    tp1Hit: false,
    tp2Hit: false,
    tp3Hit: false,
    stopHit: false,
    finalPnlR: null,
    closedAt: null,
    postedAt: new Date(),
    postedBy: "admin-1",
    ...overrides,
  };
}

function makeSignalsDeps(overrides: Record<string, unknown> = {}) {
  return {
    notifyPublishedSignal: vi.fn().mockResolvedValue(undefined),
    notifySignalOutcome: vi.fn().mockResolvedValue(undefined),
    publishRealtimeMessage: null,
    signals: {
      listByStatus: vi.fn().mockResolvedValue({ data: [], hasNext: false, nextCursor: null }),
      listTakenIdsForUser: vi.fn().mockResolvedValue([]),
      findById: vi.fn().mockResolvedValue(null),
      createWithAudit: vi.fn(),
      updateWithAudit: vi.fn(),
      deleteWithAudit: vi.fn(),
      findTaken: vi.fn().mockResolvedValue(null),
      createTaken: vi.fn().mockResolvedValue(undefined),
      deleteTaken: vi.fn().mockResolvedValue(undefined),
      findDiscussionChannel: vi.fn().mockResolvedValue(null),
      createAutoPostMessage: vi.fn(),
      touchChannel: vi.fn(),
      ...overrides,
    },
  } as never;
}

// ─── listSignalsForUser ────────────────────────────────────────────────────────

describe("SignalService.listSignalsForUser", () => {
  it("merges signal rows with taken state for the current user", async () => {
    const service = new SignalService({
      notifyPublishedSignal: vi.fn(),
      notifySignalOutcome: vi.fn(),
      publishRealtimeMessage: null,
      signals: {
        listByStatus: vi.fn().mockResolvedValue({
          data: [
            { id: "signal-1", coin: "BTC", postedAt: new Date() },
            { id: "signal-2", coin: "ETH", postedAt: new Date() },
          ],
          hasNext: false,
          nextCursor: null,
        }),
        listTakenIdsForUser: vi.fn().mockResolvedValue(["signal-2"]),
      } as never,
    });

    const result = await service.listSignalsForUser({ userId: "user-1" });

    expect(result.signals).toEqual([
      expect.objectContaining({ id: "signal-1", takenByMe: false }),
      expect.objectContaining({ id: "signal-2", takenByMe: true }),
    ]);
    expect(result.meta).toMatchObject({ hasNext: false });
  });

  it("returns an empty signals array when no signals exist", async () => {
    const service = new SignalService(makeSignalsDeps());

    const result = await service.listSignalsForUser({ userId: "user-1" });

    expect(result.signals).toHaveLength(0);
    expect(result.meta.hasNext).toBe(false);
  });
});

// ─── updateSignal ─────────────────────────────────────────────────────────────

describe("SignalService.updateSignal", () => {
  it("throws SIGNAL_NOT_FOUND when updating a signal that does not exist", async () => {
    const service = new SignalService(makeSignalsDeps());

    await expect(
      service.updateSignal("missing-signal", {}, { adminId: "admin-1" }),
    ).rejects.toMatchObject({
      code: "SIGNAL_NOT_FOUND",
      statusCode: 404,
    } satisfies Partial<AppError>);
  });

  it("updates signal and returns the result", async () => {
    const existing = makeSignal();
    const updated = makeSignal({ status: "TP1_HIT" });
    const updateWithAudit = vi.fn().mockResolvedValue(updated);

    const service = new SignalService(
      makeSignalsDeps({
        findById: vi.fn().mockResolvedValue(existing),
        updateWithAudit,
      }),
    );

    const result = await service.updateSignal(
      "signal-1",
      { status: "TP1_HIT" as never },
      { adminId: "admin-1" },
    );

    expect(updateWithAudit).toHaveBeenCalledWith(
      "signal-1",
      expect.objectContaining({ adminId: "admin-1" }),
    );
    expect(result).toMatchObject({ id: "signal-1" });
  });
});

// ─── deleteSignal ─────────────────────────────────────────────────────────────

describe("SignalService.deleteSignal", () => {
  it("throws SIGNAL_NOT_FOUND when deleting a non-existent signal", async () => {
    const service = new SignalService(makeSignalsDeps());

    await expect(
      service.deleteSignal("ghost-id", { adminId: "admin-1" }),
    ).rejects.toMatchObject({
      code: "SIGNAL_NOT_FOUND",
      statusCode: 404,
    } satisfies Partial<AppError>);
  });

  it("calls deleteWithAudit with the correct params", async () => {
    const deleteWithAudit = vi.fn().mockResolvedValue(undefined);
    const service = new SignalService(
      makeSignalsDeps({
        findById: vi.fn().mockResolvedValue(makeSignal()),
        deleteWithAudit,
      }),
    );

    await service.deleteSignal("signal-1", { adminId: "admin-1", ipAddress: "1.2.3.4" });

    expect(deleteWithAudit).toHaveBeenCalledWith("signal-1", {
      adminId: "admin-1",
      ipAddress: "1.2.3.4",
    });
  });
});

// ─── toggleTakenState ─────────────────────────────────────────────────────────

describe("SignalService.toggleTakenState", () => {
  it("throws SIGNAL_NOT_FOUND when signal does not exist", async () => {
    const service = new SignalService(makeSignalsDeps());

    await expect(
      service.toggleTakenState("user-1", "missing-id"),
    ).rejects.toMatchObject({ code: "SIGNAL_NOT_FOUND", statusCode: 404 });
  });

  it("creates a taken record when signal has not been taken", async () => {
    const createTaken = vi.fn().mockResolvedValue(undefined);
    const service = new SignalService(
      makeSignalsDeps({
        findById: vi.fn().mockResolvedValue(makeSignal()),
        findTaken: vi.fn().mockResolvedValue(null),
        createTaken,
      }),
    );

    const result = await service.toggleTakenState("user-1", "signal-1");

    expect(createTaken).toHaveBeenCalledWith("user-1", "signal-1");
    expect(result).toEqual({ taken: true });
  });

  it("removes the taken record when signal is already taken", async () => {
    const deleteTaken = vi.fn().mockResolvedValue(undefined);
    const service = new SignalService(
      makeSignalsDeps({
        findById: vi.fn().mockResolvedValue(makeSignal()),
        findTaken: vi.fn().mockResolvedValue({ userId: "user-1", signalId: "signal-1" }),
        deleteTaken,
      }),
    );

    const result = await service.toggleTakenState("user-1", "signal-1");

    expect(deleteTaken).toHaveBeenCalledWith("user-1", "signal-1");
    expect(result).toEqual({ taken: false });
  });
});

// ─── createSignal ─────────────────────────────────────────────────────────────

describe("SignalService.createSignal", () => {
  it("rejects untrusted chart image URLs", async () => {
    const service = new SignalService(makeSignalsDeps());

    await expect(
      service.createSignal(
        {
          coin: "BTC",
          direction: "LONG" as never,
          entryZone: "90000-91000",
          stopLoss: "88000",
          tp1: "93000",
          tp2: "95000",
          tp3: "98000",
          riskLevel: "MEDIUM" as never,
          timeframe: "4H",
          rrRatio: 2.5,
          reasoning: "Strong support level",
          chartImageUrl: "https://malicious-site.com/chart.png",
          status: "ACTIVE" as never,
          isPremiumOnly: true,
        },
        { adminId: "admin-1" },
      ),
    ).rejects.toMatchObject({
      code: "BAD_REQUEST",
      statusCode: 400,
    } satisfies Partial<AppError>);
  });

  it("creates a signal and returns it", async () => {
    const created = makeSignal();
    const createWithAudit = vi.fn().mockResolvedValue(created);

    const service = new SignalService(
      makeSignalsDeps({ createWithAudit }),
    );

    const input = {
      coin: "BTC",
      direction: "LONG" as never,
      entryZone: "90000-91000",
      stopLoss: "88000",
      tp1: "93000",
      tp2: "95000",
      tp3: "98000",
      riskLevel: "MEDIUM" as never,
      timeframe: "4H",
      rrRatio: 2.5,
      reasoning: "Strong support level",
      chartImageUrl: "https://utfs.io/f/chart-image",
      status: "ACTIVE" as never,
      isPremiumOnly: true,
    };

    const result = await service.createSignal(input, { adminId: "admin-1" });

    expect(createWithAudit).toHaveBeenCalledWith(
      expect.objectContaining({ adminId: "admin-1" }),
    );
    expect(result).toMatchObject({ id: "signal-1", coin: "BTC" });
  });
});
