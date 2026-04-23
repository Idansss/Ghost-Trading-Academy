import { type ClassValue, clsx } from "clsx";
import type { Trade } from "@prisma/client";
import { format, formatDistanceToNowStrict } from "date-fns";
import { twMerge } from "tailwind-merge";
import logger from "@/server/core/logger";

/**
 * Merges conditional Tailwind class names.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats a number as a percentage with sign.
 */
export function formatPercent(value: number, digits = 1) {
  return `${value > 0 ? "+" : ""}${value.toFixed(digits)}%`;
}

/**
 * Formats a number as a currency string.
 */
export function formatCurrency(value: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Formats a date relative to now.
 */
export function fromNow(date: Date | string) {
  return formatDistanceToNowStrict(new Date(date), { addSuffix: true });
}

/**
 * Derives the month key used across journal analytics.
 */
export function getMonthKey(date: Date | string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    year: "numeric",
  })
    .format(new Date(date))
    .toUpperCase()
    .replace(" ", "_");
}

/**
 * Parses the request body into JSON.
 */
export async function safeJson<T>(request: Request): Promise<T> {
  return (await request.json()) as T;
}

/**
 * Produces a standard API error response envelope.
 * AUDIT FIX: Changed response shape from { error: string } to the required envelope
 * { success: false, error: { code, message } } so all error responses are consistent
 * with AppError-originated responses from createRouteHandler routes.
 */
export function apiError(message: string, status = 400, code = "BAD_REQUEST") {
  return Response.json({ success: false, error: { code, message } }, { status });
}

/**
 * Maps thrown errors to the correct HTTP response.
 * AUDIT FIX: Replaced console.error with pino logger and removed string-based
 * error message matching now that requireUser/requireAdmin throw AppError instances.
 */
export function handleApiError(error: unknown, fallbackMessage = "Internal server error."): Response {
  if (error instanceof Error && "statusCode" in error && "code" in error) {
    const appErr = error as { statusCode: number; code: string; message: string };
    return apiError(appErr.message, appErr.statusCode, appErr.code);
  }
  logger.error({ type: "unhandled_api_error", err: error });
  return apiError(fallbackMessage, 500, "INTERNAL_ERROR");
}

export function exportTradesToCSV(trades: Trade[], filename: string): void {
  const headers = [
    "Date",
    "Pair",
    "Direction",
    "Entry Price",
    "Stop Loss",
    "Take Profit",
    "R:R Ratio",
    "Risk %",
    "Setup Type",
    "Outcome",
    "P&L %",
    "Notes",
  ];

  const rows = trades.map((trade) => [
    format(new Date(trade.tradeDate), "yyyy-MM-dd"),
    trade.coin,
    trade.direction,
    trade.entryPrice?.toString() ?? "",
    trade.stopLoss?.toString() ?? "",
    trade.takeProfit?.toString() ?? "",
    trade.rrRatio?.toFixed(2) ?? "",
    trade.riskPercent?.toFixed(2) ?? "",
    trade.setupType ?? "",
    trade.outcome,
    (trade.pnlPercent ?? 0).toString(),
    (trade.notes ?? "")
      .replace(/<[^>]*>/g, "")
      .replace(/\r?\n/g, " ")
      .replace(/"/g, '""'),
  ]);

  const csvContent = [headers, ...rows]
    .map((row) => row.map((cell) => `"${cell}"`).join(","))
    .join("\r\n");

  const BOM = "\uFEFF";
  const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}
