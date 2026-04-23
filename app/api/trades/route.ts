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
import { MONTH_NAMES } from "@/lib/constants";
import { requireAuthenticatedUser } from "@/server/core/auth";
import { AppError } from "@/server/core/app-error";
import { created, success } from "@/server/core/http";
import { createRouteHandler } from "@/server/core/route";
import { parseJsonBody, parseSearchParams } from "@/server/core/validation";
import { tradeService } from "@/server/services/trade-service";

export const dynamic = "force-dynamic";

const tradeListQuerySchema = z.object({
  month: z.string().optional(),
  search: z.string().optional(),
  pair: z.string().optional(),
  outcome: z.string().optional(),
  direction: z.string().optional(),
  setup: z.string().optional(),
  tags: z.union([z.string(), z.array(z.string())]).optional(),
  tag: z.union([z.string(), z.array(z.string())]).optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
});

const directionSchema = z.enum(["LONG", "SHORT"]);
const tradeOutcomeSchema = z.enum([
  "WIN",
  "LOSS",
  "BREAKEVEN",
  "PENDING",
  "CANCELLED",
]);

function normalizeTextFilter(value?: string) {
  const trimmed = value?.trim();

  if (!trimmed || trimmed.toUpperCase() === "ALL") {
    return undefined;
  }

  return trimmed;
}

function normalizeMonthFilter(value?: string) {
  const normalized = normalizeTextFilter(value)?.toUpperCase();

  if (!normalized) {
    return undefined;
  }

  const [month, year] = normalized.split("_");
  if (!month || !MONTH_NAMES.includes(month)) {
    return undefined;
  }

  const resolvedYear =
    year && /^\d{4}$/.test(year) ? year : String(new Date().getFullYear());

  return `${month}_${resolvedYear}`;
}

function parseDateFilter(value: string | undefined, label: string) {
  const normalized = normalizeTextFilter(value);

  if (!normalized) {
    return undefined;
  }

  const parsed = new Date(normalized);
  if (Number.isNaN(parsed.getTime())) {
    throw AppError.badRequest(`Invalid ${label} filter.`);
  }

  return parsed;
}

function parseEnumFilter<TEnum extends z.ZodEnum<[string, ...string[]]>>(
  schema: TEnum,
  value?: string,
): z.infer<TEnum> | undefined {
  const normalized = normalizeTextFilter(value)?.toUpperCase();
  if (!normalized) {
    return undefined;
  }

  const parsed = schema.safeParse(normalized);
  return parsed.success ? parsed.data : undefined;
}

function normalizeTagFilters(
  primary?: string | string[],
  legacy?: string | string[],
) {
  const values = [primary, legacy]
    .flatMap((value) => (Array.isArray(value) ? value : value ? [value] : []))
    .map((value) => value.trim())
    .filter((value) => value.length > 0 && value.toUpperCase() !== "ALL");

  return values.length > 0 ? Array.from(new Set(values)) : undefined;
}

export const GET = createRouteHandler(async ({ request }) => {
  const user = await requireAuthenticatedUser();
  const query = parseSearchParams(request, tradeListQuerySchema);
  const fromDate = parseDateFilter(query.from ?? query.startDate, "from date");
  const toDate = parseDateFilter(query.to ?? query.endDate, "to date");
  if (fromDate && toDate && fromDate > toDate) {
    throw AppError.badRequest("The from date must be before the to date.");
  }

  const result = await tradeService.listTrades(user.id, {
    month: normalizeMonthFilter(query.month),
    search: normalizeTextFilter(query.search ?? query.pair),
    // AUDIT FIX: Backward-compatible filter parsing now accepts legacy query
    // params (pair/tag/startDate/endDate) and ignores unknown enum values
    // instead of letting Prisma turn them into 500s.
    outcome: parseEnumFilter(tradeOutcomeSchema, query.outcome) as
      | TradeOutcome
      | undefined,
    direction: parseEnumFilter(directionSchema, query.direction) as
      | Direction
      | undefined,
    setup: normalizeTextFilter(query.setup),
    tags: normalizeTagFilters(query.tags, query.tag),
    from: fromDate,
    to: toDate,
    cursor: normalizeTextFilter(query.cursor),
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
