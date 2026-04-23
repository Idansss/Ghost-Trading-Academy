import type { Prisma, PrismaClient, SignalStatus } from "@prisma/client";
import { subDays } from "date-fns";
import { prisma } from "@/lib/prisma";
import {
  calculateSignalPerformanceStats,
  buildSignalEquityCurve,
  settledSignalStatuses,
} from "@/lib/signal-performance";

export class SignalRepository {
  constructor(private readonly db: PrismaClient = prisma) {}

  // AUDIT FIX: listByStatus previously returned an unbounded array, violating the
  // rule that every list endpoint must paginate. Now supports cursor-based pagination:
  // fetches limit+1 rows, checks hasNext, and returns { data, hasNext, nextCursor }.
  async listByStatus(
    status?: SignalStatus,
    options?: { cursor?: string; limit?: number },
  ) {
    const limit = Math.min(options?.limit ?? 20, 100);

    const signals = await this.db.signal.findMany({
      where: status ? { status } : undefined,
      orderBy: { postedAt: "desc" },
      take: limit + 1,
      ...(options?.cursor
        ? { cursor: { id: options.cursor }, skip: 1 }
        : {}),
    });

    const hasNext = signals.length > limit;
    const data = hasNext ? signals.slice(0, limit) : signals;
    const nextCursor = hasNext ? (data.at(-1)?.id ?? null) : null;

    return { data, hasNext, nextCursor };
  }

  async listTakenIdsForUser(userId: string) {
    const records = await this.db.signalTaken.findMany({
      where: { userId },
      select: { signalId: true },
    });

    return records.map((record) => record.signalId);
  }

  async findById(id: string) {
    return this.db.signal.findUnique({
      where: { id },
    });
  }

  async createWithAudit(input: {
    signalData: Prisma.SignalUncheckedCreateInput;
    adminId: string;
    ipAddress?: string | null;
  }) {
    return this.db.$transaction(async (tx) => {
      const signal = await tx.signal.create({
        data: input.signalData,
      });

      await tx.announcement.create({
        data: {
          title: `${signal.coin} ${signal.direction} signal`,
          message: signal.reasoning,
          type: "SIGNAL_UPDATE",
          postedBy: input.adminId,
        },
      });

      await tx.auditLog.create({
        data: {
          userId: input.adminId,
          action: "SIGNAL_CREATED",
          entity: "Signal",
          entityId: signal.id,
          ip: input.ipAddress ?? null,
        },
      });

      return signal;
    });
  }

  async updateWithAudit(
    signalId: string,
    input: {
      data: Prisma.SignalUncheckedUpdateInput;
      adminId: string;
      ipAddress?: string | null;
    },
  ) {
    return this.db.$transaction(async (tx) => {
      const signal = await tx.signal.update({
        where: { id: signalId },
        data: input.data,
      });

      await tx.auditLog.create({
        data: {
          userId: input.adminId,
          action: "SIGNAL_UPDATED",
          entity: "Signal",
          entityId: signal.id,
          ip: input.ipAddress ?? null,
        },
      });

      return signal;
    });
  }

  async deleteWithAudit(
    signalId: string,
    input: {
      adminId: string;
      ipAddress?: string | null;
    },
  ) {
    await this.db.$transaction(async (tx) => {
      await tx.signal.delete({
        where: { id: signalId },
      });

      await tx.auditLog.create({
        data: {
          userId: input.adminId,
          action: "SIGNAL_DELETED",
          entity: "Signal",
          entityId: signalId,
          ip: input.ipAddress ?? null,
        },
      });
    });
  }

  async findDiscussionChannel() {
    return this.db.chatChannel.findUnique({
      where: { slug: "signals-discussion" },
      select: { id: true },
    });
  }

  async createAutoPostMessage(channelId: string, authorId: string, body: string) {
    return this.db.chatMessage.create({
      data: {
        channelId,
        authorId,
        body,
      },
      include: {
        author: {
          select: { id: true, name: true, avatarUrl: true },
        },
        reactions: {
          select: { emoji: true, userId: true },
        },
        replyTo: {
          select: {
            id: true,
            body: true,
            imageUrl: true,
            author: { select: { name: true } },
          },
        },
      },
    });
  }

  async touchChannel(channelId: string) {
    await this.db.chatChannel.update({
      where: { id: channelId },
      data: { updatedAt: new Date() },
    });
  }

  async findTaken(userId: string, signalId: string) {
    return this.db.signalTaken.findUnique({
      where: {
        userId_signalId: {
          userId,
          signalId,
        },
      },
    });
  }

  async createTaken(userId: string, signalId: string) {
    await this.db.signalTaken.create({
      data: {
        userId,
        signalId,
      },
    });
  }

  async deleteTaken(userId: string, signalId: string) {
    await this.db.signalTaken.delete({
      where: {
        userId_signalId: {
          userId,
          signalId,
        },
      },
    });
  }
}

export const signalRepository = new SignalRepository();

/**
 * Fetches all settled signals for the track record page and stats endpoint.
 * Moved from lib/signal-performance.ts to keep that module client-safe
 * (no Prisma imports so it can be bundled into client components).
 */
export async function getSignalTrackRecord(range: "30d" | "90d" | "all" = "all") {
  const since =
    range === "30d"
      ? subDays(new Date(), 30)
      : range === "90d"
        ? subDays(new Date(), 90)
        : null;

  const signals = await prisma.signal.findMany({
    where: {
      status: { in: settledSignalStatuses },
      ...(since ? { closedAt: { gte: since } } : {}),
    },
    orderBy: { closedAt: "desc" },
    select: {
      id: true,
      coin: true,
      direction: true,
      status: true,
      tp1Hit: true,
      tp2Hit: true,
      tp3Hit: true,
      stopHit: true,
      finalPnlR: true,
      closedAt: true,
      postedAt: true,
      entryZone: true,
      stopLoss: true,
      tp1: true,
      tp2: true,
      tp3: true,
      rrRatio: true,
      outcomeNote: true,
    },
  });

  return {
    stats: calculateSignalPerformanceStats(signals),
    signals,
    equityCurve: buildSignalEquityCurve(signals),
  };
}
