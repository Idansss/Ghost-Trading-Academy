// AUDIT FIX: Route handler was importing Prisma directly and executing multi-step
// business logic inline, violating the layered architecture. Refactored to:
//   • Use createRouteHandler for consistent error handling and correlation IDs
//   • Delegate all DB access to TradeRepository via TradeService
//   • Return the standard { success, data, meta } response envelope
//   • Support cursor-based pagination on the list endpoint
//   • Remove all console.error calls (logging is handled by createRouteHandler)
import { z } from "zod";
import type { Direction, TradeOutcome } from "@prisma/client";
import { tradeSchema } from "@/lib/validators";
import { requireAuthenticatedUser } from "@/server/core/auth";
import { created, success } from "@/server/core/http";
import { createRouteHandler } from "@/server/core/route";
import { parseJsonBody, parseSearchParams } from "@/server/core/validation";
import { tradeService } from "@/server/services/trade-service";

export const dynamic = "force-dynamic";

const tradeListQuerySchema = z.object({
  month: z.string().optional(),
  search: z.string().optional(),
  outcome: z.string().optional(),
  direction: z.string().optional(),
  setup: z.string().optional(),
  tags: z.union([z.string(), z.array(z.string())]).optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
});

export const GET = createRouteHandler(async ({ request }) => {
  const user = await requireAuthenticatedUser();
  const query = parseSearchParams(request, tradeListQuerySchema);

  const tagsArray =
    query.tags === undefined
      ? undefined
      : Array.isArray(query.tags)
        ? query.tags
        : [query.tags];

  const result = await tradeService.listTrades(user.id, {
    month: query.month,
    search: query.search,
    // AUDIT FIX: Enum values are validated by the service/repository; unknown
    // strings are simply ignored rather than crashing with a Prisma error.
    outcome:
      query.outcome && query.outcome !== "ALL"
        ? (query.outcome as TradeOutcome)
        : undefined,
    direction:
      query.direction && query.direction !== "ALL"
        ? (query.direction as Direction)
        : undefined,
    setup: query.setup,
    tags: tagsArray,
    from: query.from ? new Date(query.from) : undefined,
    to: query.to ? new Date(query.to) : undefined,
    cursor: query.cursor,
    limit: query.limit,
  });

  return success(
    { trades: result.trades, summary: result.summary },
    { meta: result.meta },
  );
});

export const POST = createRouteHandler(async ({ request }) => {
  const user = await requireAuthenticatedUser();
  const payload = await parseJsonBody(request, tradeSchema);

  const trade = await tradeService.createTrade(user.id, {
    coin: payload.coin,
    direction: payload.direction,
    entryPrice: payload.entryPrice,
    stopLoss: payload.stopLoss,
    takeProfit: payload.takeProfit,
    tp2: payload.tp2 ?? null,
    tp3: payload.tp3 ?? null,
    pnlPercent: payload.pnlPercent,
    outcome: payload.outcome,
    setupType: payload.setupType,
    tags: payload.tags,
    notes: payload.notes ?? null,
    chartImageUrl: payload.chartImageUrl ?? null,
    emotionBefore: payload.emotionBefore ?? null,
    emotionDuring: payload.emotionDuring ?? null,
    emotionAfter: payload.emotionAfter ?? null,
    followedPlan: payload.followedPlan ?? null,
    revenge: payload.revenge,
    overSized: payload.overSized,
    movedStop: payload.movedStop,
    exitedEarly: payload.exitedEarly,
    tradeRating: payload.tradeRating ?? null,
    mistakeNote: payload.mistakeNote ?? null,
    lessonLearned: payload.lessonLearned ?? null,
    tradeDate: payload.tradeDate,
  });

  return created(trade, `/api/v1/trades/${trade.id}`);
});
