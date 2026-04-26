import { type NextRequest, NextResponse } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { type Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getRedisClient } from "@/lib/redis";
import { realtimePublisher } from "@/lib/realtime";
import { sanitizeText } from "@/lib/sanitize";
import { dispatchPublishedSignalAlerts } from "@/lib/signal-alerts";
import { tradingViewWebhookSchema } from "@/lib/validations/tradingViewWebhook";
import { mapMessage } from "@/lib/chat";
import logger from "@/server/core/logger";

export const dynamic = "force-dynamic";

// CLAUDE IMPROVEMENT: Rate limiter is lazily constructed once per cold start.
// If Redis is not configured (local dev without Upstash), rate limiting is
// skipped gracefully rather than crashing the endpoint.
let rateLimiter: Ratelimit | null | undefined;

function getRateLimiter(): Ratelimit | null {
  if (rateLimiter !== undefined) return rateLimiter;
  const redis = getRedisClient();
  if (!redis) {
    rateLimiter = null;
    return null;
  }
  rateLimiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(30, "1 m"),
    analytics: false,
  });
  return rateLimiter;
}

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

// CLAUDE IMPROVEMENT: Compute R:R ratio from numeric price levels.
// Returns 0 when the inputs can't produce a valid ratio (e.g. no TP1 provided).
function computeRrRatio(
  entry: number,
  stopLoss: number,
  tp1?: number,
): number {
  if (!tp1 || stopLoss === entry) return 0;
  const reward = Math.abs(tp1 - entry);
  const risk = Math.abs(entry - stopLoss);
  return Math.round((reward / risk) * 100) / 100;
}

// POST — receives the TradingView alert and auto-publishes a signal.
export async function POST(req: NextRequest) {
  const ip = getClientIp(req);

  // Rate limit: 30 webhooks per minute per IP
  const limiter = getRateLimiter();
  if (limiter) {
    const { success } = await limiter.limit(ip);
    if (!success) {
      return NextResponse.json(
        { error: "Rate limit exceeded" },
        { status: 429, headers: { "Retry-After": "60" } },
      );
    }
  }

  // Parse body
  let rawBody: unknown;
  try {
    rawBody = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // Validate payload
  const parseResult = tradingViewWebhookSchema.safeParse(rawBody);
  if (!parseResult.success) {
    logger.warn({
      type: "tradingview_webhook_invalid_payload",
      ip,
      errors: parseResult.error.flatten(),
    });
    return NextResponse.json(
      { error: "Invalid payload", details: parseResult.error.flatten() },
      { status: 400 },
    );
  }

  const payload = parseResult.data;

  // Look up the webhook record by secret
  const webhook = await prisma.tradingViewWebhook.findUnique({
    where: { webhookSecret: payload.secret },
    include: { user: { select: { id: true, role: true } } },
  });

  if (!webhook || !webhook.isActive) {
    logger.warn({ type: "tradingview_webhook_invalid_secret", ip });

    // Log the failed attempt if we can identify the webhook (invalid secret = no webhook found)
    // Don't expose which part failed to the caller.
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Only admin users can auto-publish signals
  if (webhook.user.role !== "ADMIN") {
    await prisma.webhookLog.create({
      data: {
        webhookId: webhook.id,
        status: "ERROR",
        payload: payload as unknown as Prisma.InputJsonValue,
        errorMessage: "User is not an admin",
        ipAddress: ip,
      },
    });
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    // Build the entryZone string (e.g. "67200 - 67500" or just "67500")
    const entryZone =
      payload.entryZoneLow && payload.entryZoneHigh
        ? `${payload.entryZoneLow} - ${payload.entryZoneHigh}`
        : String(payload.entry);

    const tp1Str = payload.tp1 ? String(payload.tp1) : "N/A";
    const tp2Str = payload.tp2 ? String(payload.tp2) : tp1Str;
    const tp3Str = payload.tp3 ? String(payload.tp3) : tp1Str;

    const rrRatio = computeRrRatio(
      payload.entryZoneLow ?? payload.entry,
      payload.stopLoss,
      payload.tp1,
    );

    const reasoning = payload.reasoning
      ? sanitizeText(payload.reasoning)
      : "Auto-generated from TradingView alert.";

    // CLAUDE IMPROVEMENT: Create the signal directly via Prisma (not signalService)
    // so we can bypass the signalSchema's min-length constraints while still
    // reusing the same notification and chat-post logic as manual signals.
    const signal = await prisma.signal.create({
      data: {
        coin: payload.coin,
        direction: payload.direction,
        entryZone,
        stopLoss: String(payload.stopLoss),
        tp1: tp1Str,
        tp2: tp2Str,
        tp3: tp3Str,
        riskLevel: payload.riskLevel,
        timeframe: payload.timeframe,
        rrRatio,
        reasoning,
        chartImageUrl: null,
        status: "ACTIVE",
        isPremiumOnly: true,
        postedBy: webhook.userId,
      },
    });

    // Log success
    await prisma.webhookLog.create({
      data: {
        webhookId: webhook.id,
        status: "SUCCESS",
        payload: payload as unknown as Prisma.InputJsonValue,
        signalId: signal.id,
        ipAddress: ip,
      },
    });

    // Update webhook stats
    await prisma.tradingViewWebhook.update({
      where: { id: webhook.id },
      data: {
        lastTriggeredAt: new Date(),
        triggerCount: { increment: 1 },
      },
    });

    // Fire notifications + auto-post — errors here must not fail the 200 response
    await Promise.allSettled([
      dispatchPublishedSignalAlerts(signal).catch((err: unknown) => {
        logger.warn({ type: "tradingview_webhook_alert_failed", signalId: signal.id, err });
      }),
      autoPostSignalToChat(signal, webhook.userId),
    ]);

    return NextResponse.json({ success: true, data: { signalId: signal.id } });
  } catch (error) {
    logger.error({ type: "tradingview_webhook_create_failed", ip, err: error });

    await prisma.webhookLog
      .create({
        data: {
          webhookId: webhook.id,
          status: "ERROR",
          payload: payload as unknown as Prisma.InputJsonValue,
          errorMessage: error instanceof Error ? error.message : "Unknown error",
          ipAddress: ip,
        },
      })
      .catch(() => undefined);

    return NextResponse.json({ error: "Failed to create signal" }, { status: 500 });
  }
}

// GET — health check so TradingView can verify the endpoint exists.
export async function GET() {
  return NextResponse.json({ message: "TradingView webhook endpoint is active" });
}

// CLAUDE IMPROVEMENT: Reuses the same discussion-channel auto-post logic as
// signalService so webhook-created signals appear in chat identically to
// manually created ones.
async function autoPostSignalToChat(
  signal: { id: string; coin: string; direction: string; entryZone: string; stopLoss: string; tp1: string; tp2: string; tp3: string; riskLevel: string; timeframe: string; reasoning: string },
  adminId: string,
) {
  try {
    const discussionChannel = await prisma.chatChannel.findUnique({
      where: { slug: "signals-discussion" },
      select: { id: true },
    });

    if (!discussionChannel) return;

    const body = [
      `Signal: ${signal.coin} ${signal.direction}`,
      `Entry: ${signal.entryZone}`,
      `Stop: ${signal.stopLoss}`,
      `TP1: ${signal.tp1} | TP2: ${signal.tp2} | TP3: ${signal.tp3}`,
      `Risk: ${signal.riskLevel} | Timeframe: ${signal.timeframe}`,
      `Reasoning: ${signal.reasoning}`,
    ].join("\n");

    const message = await prisma.chatMessage.create({
      data: { channelId: discussionChannel.id, authorId: adminId, body },
      include: {
        author: { select: { id: true, name: true, avatarUrl: true } },
        reactions: { select: { emoji: true, userId: true } },
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

    await prisma.chatChannel.update({
      where: { id: discussionChannel.id },
      data: { updatedAt: new Date() },
    });

    await realtimePublisher.trigger(
      `chat-channel-${discussionChannel.id}`,
      "new-message",
      mapMessage(message, adminId),
    );
  } catch (err) {
    logger.warn({ type: "tradingview_webhook_chat_post_failed", signalId: signal.id, err });
  }
}
