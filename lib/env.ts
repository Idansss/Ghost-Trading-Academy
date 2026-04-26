import { z } from "zod";

const inferredNextAuthUrl =
  process.env.NEXTAUTH_URL ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined);

if (!process.env.NEXTAUTH_URL && inferredNextAuthUrl) {
  process.env.NEXTAUTH_URL = inferredNextAuthUrl;
}

const serverEnvSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required."),
  // AUDIT FIX: Secrets shorter than 32 characters are cryptographically weak.
  // A min(1) check allowed single-character secrets through at startup.
  NEXTAUTH_SECRET: z.string().min(32, "NEXTAUTH_SECRET must be at least 32 characters."),
  NEXTAUTH_URL: z.string().url("NEXTAUTH_URL must be a valid URL."),
  NEXT_PUBLIC_SUPABASE_URL: z
    .string()
    .optional()
    .or(z.literal(""))
    .transform((v) => v || undefined),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z
    .string()
    .optional()
    .or(z.literal(""))
    .transform((v) => v || undefined),
  SUPABASE_URL: z
    .string()
    .optional()
    .or(z.literal(""))
    .transform((v) => v || undefined),
  SUPABASE_SERVICE_ROLE_KEY: z
    .string()
    .optional()
    .or(z.literal(""))
    .transform((v) => v || undefined),
  SUPABASE_STORAGE_BUCKET: z
    .string()
    .optional()
    .or(z.literal(""))
    .transform((v) => v || undefined),
  RESEND_API_KEY: z.string().min(1).optional(),
  RESEND_FROM_EMAIL: z.string().email().optional(),
  NEXT_PUBLIC_CONTACT_LINK: z.string().url().optional(),
  ONESIGNAL_APP_ID: z.string().uuid().optional(),
  ONESIGNAL_REST_API_KEY: z.string().min(1).optional(),
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1).optional(),
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  // Sentry error monitoring — all optional; app works without them.
  SENTRY_DSN: z.string().url().optional().or(z.literal("")).transform((v) => v || undefined),
  NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional().or(z.literal("")).transform((v) => v || undefined),
  SENTRY_AUTH_TOKEN: z.string().min(1).optional().or(z.literal("")).transform((v) => v || undefined),
  SENTRY_ORG: z.string().min(1).optional().or(z.literal("")).transform((v) => v || undefined),
  SENTRY_PROJECT: z.string().min(1).optional().or(z.literal("")).transform((v) => v || undefined),
  // AUDIT FIX: Use .optional().or(z.literal("")) so that empty strings in .env
  // (which is the default in .env.example) are accepted without failing min(1).
});

const parsedEnv = serverEnvSchema.parse({
  DATABASE_URL: process.env.DATABASE_URL,
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
  NEXTAUTH_URL: process.env.NEXTAUTH_URL,
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  SUPABASE_STORAGE_BUCKET: process.env.SUPABASE_STORAGE_BUCKET,
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL,
  NEXT_PUBLIC_CONTACT_LINK: process.env.NEXT_PUBLIC_CONTACT_LINK,
  ONESIGNAL_APP_ID: process.env.ONESIGNAL_APP_ID,
  ONESIGNAL_REST_API_KEY: process.env.ONESIGNAL_REST_API_KEY,
  UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
  UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  SENTRY_DSN: process.env.SENTRY_DSN,
  NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
  SENTRY_AUTH_TOKEN: process.env.SENTRY_AUTH_TOKEN,
  SENTRY_ORG: process.env.SENTRY_ORG,
  SENTRY_PROJECT: process.env.SENTRY_PROJECT,
});

const supabasePublicUrl = parsedEnv.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServerUrl = parsedEnv.SUPABASE_URL ?? supabasePublicUrl;

export const env = {
  databaseUrl: parsedEnv.DATABASE_URL,
  nextAuthSecret: parsedEnv.NEXTAUTH_SECRET,
  nextAuthUrl: parsedEnv.NEXTAUTH_URL,
  nextPublicSupabaseUrl: supabasePublicUrl,
  nextPublicSupabaseAnonKey: parsedEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  supabaseUrl: supabaseServerUrl,
  supabaseServiceRoleKey: parsedEnv.SUPABASE_SERVICE_ROLE_KEY,
  supabaseStorageBucket: parsedEnv.SUPABASE_STORAGE_BUCKET ?? "desk-media",
  resendApiKey: parsedEnv.RESEND_API_KEY,
  resendFromEmail: parsedEnv.RESEND_FROM_EMAIL ?? "noreply@ghosttrading.academy",
  contactLink: parsedEnv.NEXT_PUBLIC_CONTACT_LINK ?? "#",
  onesignalAppId: parsedEnv.ONESIGNAL_APP_ID,
  onesignalRestApiKey: parsedEnv.ONESIGNAL_REST_API_KEY,
  upstashRedisUrl: parsedEnv.UPSTASH_REDIS_REST_URL,
  upstashRedisToken: parsedEnv.UPSTASH_REDIS_REST_TOKEN,
  appUrl: parsedEnv.NEXTAUTH_URL,
  publicAppUrl: parsedEnv.NEXT_PUBLIC_APP_URL ?? parsedEnv.NEXTAUTH_URL,
  // CLAUDE FIX: removed uploadthingCdnDomain — UploadThing fully replaced by Supabase Storage
} as const;
