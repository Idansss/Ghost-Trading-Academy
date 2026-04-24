import type { SignalStatus } from "@prisma/client";
import { mapMessage } from "@/lib/chat";
import { logUserActivity } from "@/lib/activity";
import { pusherServer } from "@/lib/pusher";
import { assertTrustedImageUrl, sanitizeHtml } from "@/lib/sanitize";
import {
  dispatchPublishedSignalAlerts,
  dispatchSignalOutcomeAlerts,
} from "@/lib/signal-alerts";
import type { signalPatchSchema, signalSchema } from "@/lib/validators";
import { AppError } from "@/server/core/app-error";
import logger from "@/server/core/logger";
import {
  type SignalRepository,
  signalRepository,
} from "@/server/repositories/signal-repository";
import type { z } from "zod";

const closedSignalStatuses = new Set<SignalStatus>([
  "TP3_HIT",
  "STOPPED",
  "CANCELLED",
  "CLOSED",
]);

type SignalServiceDependencies = {
  notifyPublishedSignal: typeof dispatchPublishedSignalAlerts;
  notifySignalOutcome: typeof dispatchSignalOutcomeAlerts;
  publishRealtimeMessage: typeof pusherServer;
  signals: SignalRepository;
};

export class SignalService {
  constructor(private readonly deps: SignalServiceDependencies) {}

  // AUDIT FIX: Threaded cursor and limit through to the repository so the
  // list endpoint respects cursor-based pagination end-to-end.
  async listSignalsForUser(input: {
    userId: string;
    status?: SignalStatus;
    cursor?: string;
    limit?: number;
  }) {
    const [{ data: signals, hasNext, nextCursor }, takenSignalIds] =
      await Promise.all([
        this.deps.signals.listByStatus(input.status, {
          cursor: input.cursor,
          limit: input.limit,
        }),
        this.deps.signals.listTakenIdsForUser(input.userId),
      ]);

    const takenSet = new Set(takenSignalIds);

    return {
      signals: signals.map((signal) => ({
        ...signal,
        takenByMe: takenSet.has(signal.id),
      })),
      meta: { hasNext, nextCursor },
    };
  }

  async createSignal(
    input: z.infer<typeof signalSchema>,
    context: { adminId: string; ipAddress?: string | null },
  ) {
    assertTrustedImageUrl(input.chartImageUrl ?? null);

    const signal = await this.deps.signals.createWithAudit({
      signalData: {
        ...input,
        reasoning: sanitizeHtml(input.reasoning),
        chartImageUrl: input.chartImageUrl || null,
        postedBy: context.adminId,
        closedAt: null,
        finalPnlR: null,
      },
      adminId: context.adminId,
      ipAddress: context.ipAddress,
    });

    await Promise.allSettled([
      this.publishSignalAlerts(signal),
      this.publishSignalToDiscussionChannel(signal, context.adminId),
    ]);

    return signal;
  }

  async updateSignal(
    signalId: string,
    input: z.infer<typeof signalPatchSchema>,
    context: { adminId: string; ipAddress?: string | null },
  ) {
    const existingSignal = await this.deps.signals.findById(signalId);

    if (!existingSignal) {
      throw AppError.notFound("Signal", signalId);
    }

    const nextStatus = input.status ?? existingSignal.status;
    const shouldCloseSignal = closedSignalStatuses.has(nextStatus);

    if (input.chartImageUrl !== undefined) {
      assertTrustedImageUrl(input.chartImageUrl ?? null);
    }

    const signal = await this.deps.signals.updateWithAudit(signalId, {
      adminId: context.adminId,
      ipAddress: context.ipAddress,
      data: {
        coin: input.coin ?? existingSignal.coin,
        direction: input.direction ?? existingSignal.direction,
        entryZone: input.entryZone ?? existingSignal.entryZone,
        stopLoss: input.stopLoss ?? existingSignal.stopLoss,
        tp1: input.tp1 ?? existingSignal.tp1,
        tp2: input.tp2 ?? existingSignal.tp2,
        tp3: input.tp3 ?? existingSignal.tp3,
        riskLevel: input.riskLevel ?? existingSignal.riskLevel,
        timeframe: input.timeframe ?? existingSignal.timeframe,
        rrRatio: input.rrRatio ?? existingSignal.rrRatio,
        reasoning:
          input.reasoning !== undefined
            ? sanitizeHtml(input.reasoning)
            : existingSignal.reasoning,
        chartImageUrl:
          input.chartImageUrl === undefined
            ? existingSignal.chartImageUrl
            : input.chartImageUrl || null,
        status: nextStatus,
        isPremiumOnly: input.isPremiumOnly ?? existingSignal.isPremiumOnly,
        outcomeNote:
          input.outcomeNote === undefined
            ? existingSignal.outcomeNote
            : input.outcomeNote
              ? sanitizeHtml(input.outcomeNote)
              : null,
        tp1Hit: input.tp1Hit ?? existingSignal.tp1Hit,
        tp2Hit: input.tp2Hit ?? existingSignal.tp2Hit,
        tp3Hit: input.tp3Hit ?? existingSignal.tp3Hit,
        stopHit: input.stopHit ?? existingSignal.stopHit,
        finalPnlR:
          input.finalPnlR === undefined
            ? existingSignal.finalPnlR
            : input.finalPnlR,
        closedAt: shouldCloseSignal
          ? existingSignal.closedAt ?? new Date()
          : null,
      },
    });

    try {
      await this.deps.notifySignalOutcome(existingSignal, signal);
    } catch (error) {
      logger.warn({
        type: "signal_outcome_alert_failed",
        signalId,
        errorMessage: error instanceof Error ? error.message : "Unknown error",
      });
    }

    return signal;
  }

  async deleteSignal(
    signalId: string,
    context: { adminId: string; ipAddress?: string | null },
  ) {
    const existingSignal = await this.deps.signals.findById(signalId);

    if (!existingSignal) {
      throw AppError.notFound("Signal", signalId);
    }

    await this.deps.signals.deleteWithAudit(signalId, {
      adminId: context.adminId,
      ipAddress: context.ipAddress,
    });
  }

  async toggleTakenState(userId: string, signalId: string) {
    const signal = await this.deps.signals.findById(signalId);

    if (!signal) {
      throw AppError.notFound("Signal", signalId);
    }

    const existingRecord = await this.deps.signals.findTaken(userId, signalId);

    if (existingRecord) {
      await this.deps.signals.deleteTaken(userId, signalId);
      return { taken: false };
    }

    await this.deps.signals.createTaken(userId, signalId);
    await logUserActivity(userId, "SIGNAL_TAKEN");

    return { taken: true };
  }

  async getTakenState(userId: string, signalId: string) {
    const signal = await this.deps.signals.findById(signalId);

    if (!signal) {
      throw AppError.notFound("Signal", signalId);
    }

    const existingRecord = await this.deps.signals.findTaken(userId, signalId);

    return { taken: Boolean(existingRecord) };
  }

  private async publishSignalAlerts(
    signal: Awaited<ReturnType<SignalRepository["createWithAudit"]>>,
  ) {
    try {
      await this.deps.notifyPublishedSignal(signal);
    } catch (error) {
      logger.warn({
        type: "signal_alert_dispatch_failed",
        signalId: signal.id,
        errorMessage: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  private async publishSignalToDiscussionChannel(
    signal: Awaited<ReturnType<SignalRepository["createWithAudit"]>>,
    adminId: string,
  ) {
    try {
      const discussionChannel = await this.deps.signals.findDiscussionChannel();

      if (!discussionChannel) {
        return;
      }

      const autoPostMessage = await this.deps.signals.createAutoPostMessage(
        discussionChannel.id,
        adminId,
        [
          `Signal: ${signal.coin} ${signal.direction}`,
          `Entry: ${signal.entryZone}`,
          `Stop: ${signal.stopLoss}`,
          `TP1: ${signal.tp1} | TP2: ${signal.tp2} | TP3: ${signal.tp3}`,
          `Risk: ${signal.riskLevel} | Timeframe: ${signal.timeframe}`,
          `Reasoning: ${signal.reasoning}`,
        ].join("\n"),
      );

      await this.deps.signals.touchChannel(discussionChannel.id);
      await this.deps.publishRealtimeMessage?.trigger(
        `chat-channel-${discussionChannel.id}`,
        "new-message",
        mapMessage(autoPostMessage, adminId),
      );
    } catch (error) {
      logger.warn({
        type: "signal_chat_autopost_failed",
        signalId: signal.id,
        errorMessage: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
}

export const signalService = new SignalService({
  notifyPublishedSignal: dispatchPublishedSignalAlerts,
  notifySignalOutcome: dispatchSignalOutcomeAlerts,
  publishRealtimeMessage: pusherServer,
  signals: signalRepository,
});
