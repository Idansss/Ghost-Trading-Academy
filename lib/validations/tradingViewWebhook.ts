import { z } from "zod";

// CLAUDE IMPROVEMENT: Strict schema for TradingView webhook payloads.
// All numeric price fields are numbers (not strings) to make arithmetic easy
// in the handler. The Signal model stores prices as strings — conversion happens
// in the route handler, not here, so this schema stays clean.
export const tradingViewWebhookSchema = z.object({
  secret: z.string().min(10, "Invalid secret format"),
  coin: z
    .string()
    .min(2, "Coin must be at least 2 characters")
    .max(20, "Coin must be at most 20 characters")
    .toUpperCase(),
  direction: z.enum(["LONG", "SHORT"]),
  entry: z.number().positive("Entry must be a positive number"),
  entryZoneLow: z.number().positive().optional(),
  entryZoneHigh: z.number().positive().optional(),
  stopLoss: z.number().positive("Stop loss must be a positive number"),
  tp1: z.number().positive().optional(),
  tp2: z.number().positive().optional(),
  tp3: z.number().positive().optional(),
  riskLevel: z.enum(["LOW", "MEDIUM", "HIGH"]).default("MEDIUM"),
  timeframe: z.string().min(1).max(10).default("4H"),
  reasoning: z.string().max(2000).optional(),
});

export type TradingViewWebhookPayload = z.infer<typeof tradingViewWebhookSchema>;
