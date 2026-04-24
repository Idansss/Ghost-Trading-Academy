import { EmotionState, MarketBias, OnboardingStep, ResourceType, RiskLevel, Role, SignalStatus, TradeOutcome, type Direction } from "@prisma/client";
import { z } from "zod";
import { TICKER_SYMBOL_SET } from "@/lib/constants";

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
    referralCode: z.string().optional(),
    terms: z.boolean().refine((value) => value, {
      message: "Please confirm your registration details.",
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
  tags: z.array(z.string().min(1)).default([]),
  notes: z.string().optional().nullable(),
  chartImageUrl: z.string().url().optional().or(z.literal("")).nullable(),
  emotionBefore: z.nativeEnum(EmotionState).optional().nullable(),
  emotionDuring: z.nativeEnum(EmotionState).optional().nullable(),
  emotionAfter: z.nativeEnum(EmotionState).optional().nullable(),
  followedPlan: z.boolean().optional().nullable(),
  revenge: z.boolean().default(false),
  overSized: z.boolean().default(false),
  movedStop: z.boolean().default(false),
  exitedEarly: z.boolean().default(false),
  tradeRating: z.coerce.number().int().min(1).max(5).optional().nullable(),
  mistakeNote: z.string().max(1000).optional().nullable(),
  lessonLearned: z.string().max(1000).optional().nullable(),
  tradeDate: z.string(),
});

export const weeklyReviewSchema = z.object({
  weekStartDate: z.string(),
  bestTrade: z.string().optional().nullable(),
  worstTrade: z.string().optional().nullable(),
  whatWorked: z.string().min(10),
  whatDidntWork: z.string().min(10),
  nextWeekFocus: z.string().min(10),
  overallRating: z.coerce.number().int().min(1).max(5),
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
  chartImageUrl: z.string().url().optional().or(z.literal("")).nullable(),
  status: z.nativeEnum(SignalStatus).default(SignalStatus.ACTIVE),
  isPremiumOnly: z.boolean().default(true),
});

export const signalOutcomeSchema = z.object({
  status: z.nativeEnum(SignalStatus),
  outcomeNote: z.string().max(500).optional().nullable(),
  tp1Hit: z.boolean().default(false),
  tp2Hit: z.boolean().default(false),
  tp3Hit: z.boolean().default(false),
  stopHit: z.boolean().default(false),
  finalPnlR: z.coerce.number().optional().nullable(),
});

export const signalPatchSchema = signalSchema.partial().extend({
  outcomeNote: z.string().max(500).optional().nullable(),
  tp1Hit: z.boolean().optional(),
  tp2Hit: z.boolean().optional(),
  tp3Hit: z.boolean().optional(),
  stopHit: z.boolean().optional(),
  finalPnlR: z.coerce.number().optional().nullable(),
});

// AUDIT FIX: Added cursor and limit fields so the signal list endpoint supports
// cursor-based pagination. All list endpoints must paginate — unbounded arrays
// are not acceptable in production.
export const signalFilterSchema = z.object({
  status: z.union([z.nativeEnum(SignalStatus), z.literal("ALL")]).optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
});

export const signalIdParamsSchema = z.object({
  id: z.string().min(1, "Signal ID is required."),
});

export const outlookSchema = z.object({
  marketBias: z.nativeEnum(MarketBias),
  biasExplanation: z.string().min(20),
  chartImageUrl: z.string().url().optional().or(z.literal("")).nullable(),
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
  isPremiumOnly: z.boolean().default(true),
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
  imageUrl: z.string().url().optional().nullable(),
});

export const memberUpdateSchema = z.object({
  userId: z.string().min(1),
  role: z.nativeEnum(Role),
});

export const memberCreateSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  temporaryPassword: z.string().min(8),
  role: z.nativeEnum(Role),
});

export const profileSchema = z.object({
  name: z.string().min(2),
  avatarUrl: z.string().url().optional().or(z.literal("")).nullable(),
  accountSize: z.coerce.number().positive().optional().nullable(),
  riskPerTrade: z.coerce.number().positive().max(100),
  leaderboardOptIn: z.boolean().default(false),
  emailSignalAlerts: z.boolean().default(true),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(8).optional().or(z.literal("")),
});

export const riskCalculatorSchema = z.object({
  accountSize: z.coerce.number().positive("Enter a valid account size."),
  riskPerTrade: z.coerce
    .number()
    .positive("Risk per trade must be greater than 0.")
    .max(100, "Risk per trade must be 100% or less."),
  entry: z.coerce.number().positive("Enter a valid entry price."),
  stopLoss: z.coerce.number().positive("Enter a valid stop loss."),
  tp1: z.coerce.number().positive().optional().nullable(),
  tp2: z.coerce.number().positive().optional().nullable(),
  tp3: z.coerce.number().positive().optional().nullable(),
});

export const pushSubscriptionSchema = z.object({
  pushPlayerId: z.string().uuid().nullable(),
});

export const onboardingStepSchema = z.object({
  step: z.nativeEnum(OnboardingStep),
});

export const onboardingTradeSchema = z.object({
  coin: z.string().min(3, "Pair is required."),
  direction: z.enum(["LONG", "SHORT"] satisfies [Direction, Direction]),
  entryPrice: z.coerce.number().positive("Enter a valid entry price."),
  stopLoss: z.coerce.number().positive("Enter a valid stop loss."),
  outcome: z.nativeEnum(TradeOutcome),
});

export const siteConfigSchema = z.object({
  tickerSymbols: z
    .array(
      z
        .string()
        .transform((value) => value.toUpperCase())
        .refine((value) => TICKER_SYMBOL_SET.has(value), {
          message: "Unsupported ticker symbol selected.",
        }),
    )
    .min(1, "Select at least one ticker symbol.")
    .max(10, "Select at most 10 ticker symbols."),
});

export const landingPageConfigSchema = z.object({
  heroHeadline: z.string().max(120).optional().nullable(),
  heroSubheadline: z.string().max(300).optional().nullable(),
  ctaLabel: z.string().min(2).max(60).default("Apply for Access"),
  ctaUrl: z.string().min(1).max(255).default("/auth/login"),
  isWaitlistMode: z.boolean().default(false),
});

export const tradeTagSchema = z.object({
  name: z.string().min(2, "Tag name is required.").max(40, "Tag name is too long."),
  color: z
    .string()
    .regex(/^#([0-9A-Fa-f]{6})$/, "Use a valid hex color like #B8860B."),
});
