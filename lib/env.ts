const required = ["DATABASE_URL", "NEXTAUTH_SECRET", "NEXTAUTH_URL"] as const;

if (typeof window === "undefined") {
  for (const key of required) {
    if (!process.env[key]) {
      throw new Error(`Missing required environment variable: ${key}`);
    }
  }
}

export const env = {
  databaseUrl: process.env.DATABASE_URL!,
  nextAuthSecret: process.env.NEXTAUTH_SECRET!,
  nextAuthUrl: process.env.NEXTAUTH_URL!,
  uploadthingSecret: process.env.UPLOADTHING_SECRET,
  uploadthingAppId: process.env.UPLOADTHING_APP_ID,
  resendApiKey: process.env.RESEND_API_KEY,
  resendFromEmail: process.env.RESEND_FROM_EMAIL ?? "noreply@apexvip.com",
  contactLink: process.env.NEXT_PUBLIC_CONTACT_LINK ?? "#",
} as const;
