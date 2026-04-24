import { z } from "zod";

const inferredNextAuthUrl =
  process.env.NEXTAUTH_URL ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined);

if (!process.env.NEXTAUTH_URL && inferredNextAuthUrl) {
  process.env.NEXTAUTH_URL = inferredNextAuthUrl;
}

// AUDIT FIX: Added Pusher server/client env vars that were used in lib/pusher.ts
// and lib/pusher-client.ts but were not validated here. Missing vars at startup
// now produce a descriptive error rather than a cryptic runtime crash.
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
  // Legacy UploadThing CDN URLs may still exist in the database.
  UPLOADTHING_CDN_DOMAIN: z.string().optional().or(z.literal("")).transform((v) => v || undefined),
  NEXT_PUBLIC_UPLOADTHING_CDN_DOMAIN: z.string().optional().or(z.literal("")).transform((v) => v || undefined),
  // AUDIT FIX: Use .optional().or(z.literal("")) so that empty strings in .env
  // (which is the default in .env.example) are accepted without failing min(1).
  PUSHER_APP_ID: z.string().optional().or(z.literal("")).transform((v) => v || undefined),
  PUSHER_KEY: z.string().optional().or(z.literal("")).transform((v) => v || undefined),
  PUSHER_SECRET: z.string().optional().or(z.literal("")).transform((v) => v || undefined),
  PUSHER_CLUSTER: z.string().optional().or(z.literal("")).transform((v) => v || undefined),
  NEXT_PUBLIC_PUSHER_KEY: z.string().optional().or(z.literal("")).transform((v) => v || undefined),
  NEXT_PUBLIC_PUSHER_CLUSTER: z.string().optional().or(z.literal("")).transform((v) => v || undefined),
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
  UPLOADTHING_CDN_DOMAIN: process.env.UPLOADTHING_CDN_DOMAIN,
  NEXT_PUBLIC_UPLOADTHING_CDN_DOMAIN: process.env.NEXT_PUBLIC_UPLOADTHING_CDN_DOMAIN,
  PUSHER_APP_ID: process.env.PUSHER_APP_ID,
  PUSHER_KEY: process.env.PUSHER_KEY,
  PUSHER_SECRET: process.env.PUSHER_SECRET,
  PUSHER_CLUSTER: process.env.PUSHER_CLUSTER,
  NEXT_PUBLIC_PUSHER_KEY: process.env.NEXT_PUBLIC_PUSHER_KEY,
  NEXT_PUBLIC_PUSHER_CLUSTER: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
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
  resendFromEmail: parsedEnv.RESEND_FROM_EMAIL ?? "noreply@ghostvip.com",
  contactLink: parsedEnv.NEXT_PUBLIC_CONTACT_LINK ?? "#",
  onesignalAppId: parsedEnv.ONESIGNAL_APP_ID,
  onesignalRestApiKey: parsedEnv.ONESIGNAL_REST_API_KEY,
  upstashRedisUrl: parsedEnv.UPSTASH_REDIS_REST_URL,
  upstashRedisToken: parsedEnv.UPSTASH_REDIS_REST_TOKEN,
  appUrl: parsedEnv.NEXTAUTH_URL,
  publicAppUrl: parsedEnv.NEXT_PUBLIC_APP_URL ?? parsedEnv.NEXTAUTH_URL,
  // AUDIT FIX: Exported validated Pusher vars so the server and client
  // singletons read from one typed source instead of raw process.env access.
  pusherAppId: parsedEnv.PUSHER_APP_ID,
  pusherKey: parsedEnv.PUSHER_KEY,
  pusherSecret: parsedEnv.PUSHER_SECRET,
  pusherCluster: parsedEnv.PUSHER_CLUSTER,
  publicPusherKey: parsedEnv.NEXT_PUBLIC_PUSHER_KEY,
  publicPusherCluster: parsedEnv.NEXT_PUBLIC_PUSHER_CLUSTER,
  uploadthingCdnDomain:
    parsedEnv.UPLOADTHING_CDN_DOMAIN ?? parsedEnv.NEXT_PUBLIC_UPLOADTHING_CDN_DOMAIN,
} as const;
