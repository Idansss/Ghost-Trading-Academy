import { MarketBias, ResourceType, RiskLevel, Role, SignalStatus, TradeOutcome, type Direction } from "@prisma/client";
import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Enter a valid email."),
  password: z.string().min(6, "Password must be at least 6 characters."),
  rememberMe: z.boolean().optional(),
});

export const registerSchema = z
  .object({
    name: z.string().min(2, "Full name is required."),
    email: z.string().email("Enter a valid email."),
    password: z.string().min(8, "Password must be at least 8 characters."),
    confirmPassword: z.string().min(8, "Confirm your password."),
    terms: z.boolean().refine((value) => value, {
      message: "You must accept the terms.",
    }),
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export const tradeSchema = z.object({
  coin: z.string().min(3),
  direction: z.enum(["LONG", "SHORT"] satisfies [Direction, Direction]),
  entryPrice: z.coerce.number().positive(),
  stopLoss: z.coerce.number().positive(),
  takeProfit: z.coerce.number().positive(),
  tp2: z.coerce.number().positive().optional().nullable(),
  tp3: z.coerce.number().positive().optional().nullable(),
  pnlPercent: z.coerce.number(),
  outcome: z.nativeEnum(TradeOutcome),
  setupType: z.string().min(2),
  notes: z.string().optional().nullable(),
  tradeDate: z.string(),
});

export const signalSchema = z.object({
  coin: z.string().min(3),
  direction: z.enum(["LONG", "SHORT"] satisfies [Direction, Direction]),
  entryZone: z.string().min(3),
  stopLoss: z.string().min(1),
  tp1: z.string().min(1),
  tp2: z.string().min(1),
  tp3: z.string().min(1),
  riskLevel: z.nativeEnum(RiskLevel),
  timeframe: z.string().min(1),
  rrRatio: z.coerce.number().nonnegative(),
  reasoning: z.string().min(10),
  status: z.nativeEnum(SignalStatus).default(SignalStatus.ACTIVE),
  isVipOnly: z.boolean().default(true),
});

export const outlookSchema = z.object({
  marketBias: z.nativeEnum(MarketBias),
  biasExplanation: z.string().min(20),
  coinsToWatch: z
    .array(
      z.object({
        coin: z.string().min(2),
        note: z.string().min(5),
      }),
    )
    .min(1),
  levels: z
    .array(
      z.object({
        coin: z.string().min(1),
        resistance: z.string().min(1),
        support: z.string().min(1),
      }),
    )
    .min(1),
  avoidToday: z.array(z.string().min(5)).min(1),
});

export const resourceSchema = z.object({
  title: z.string().min(2),
  description: z.string().min(10),
  type: z.nativeEnum(ResourceType),
  url: z.string().url(),
  fileKey: z.string().optional().nullable(),
  tag: z.string().min(2),
  isVipOnly: z.boolean().default(true),
  meta: z.string().min(2),
});

export const weeklyRecapSchema = z.object({
  weekStartDate: z.string(),
  weekEndDate: z.string(),
  totalTrades: z.coerce.number().int().nonnegative(),
  wins: z.coerce.number().int().nonnegative(),
  losses: z.coerce.number().int().nonnegative(),
  winRate: z.coerce.number().nonnegative(),
  bestTrade: z.string().min(2),
  worstTrade: z.string().min(2),
  totalPnlPercent: z.coerce.number(),
  whatWeLearned: z.string().min(20),
  nextWeekFocus: z.string().min(20),
});

export const memberWinSchema = z.object({
  coin: z.string().min(3),
  pnlPercent: z.coerce.number(),
  message: z.string().min(3),
});

export const memberUpdateSchema = z.object({
  userId: z.string().min(1),
  role: z.nativeEnum(Role),
  subscriptionStatus: z.enum(["ACTIVE", "EXPIRED", "TRIAL"]),
  subscriptionExpiry: z.string().nullable(),
});

export const memberCreateSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  temporaryPassword: z.string().min(8),
  role: z.nativeEnum(Role),
  subscriptionExpiry: z.string().nullable(),
});

export const profileSchema = z.object({
  name: z.string().min(2),
  avatarUrl: z.string().url().optional().or(z.literal("")).nullable(),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(8).optional().or(z.literal("")),
});
