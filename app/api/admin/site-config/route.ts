import { auth } from "@/lib/auth";
import { getSiteConfig, updateSiteConfig } from "@/lib/site-config";
import { landingPageConfigSchema, siteConfigSchema } from "@/lib/validators";

// AUDIT FIX: All authenticated API routes must opt out of static rendering
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();

  // AUDIT FIX: Changed all error responses from { message } to { error }.
  if (!session?.user) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (session.user.role !== "ADMIN") {
    return Response.json({ error: "Forbidden." }, { status: 403 });
  }

  const config = await getSiteConfig();
  return Response.json({ config });
}

export async function PATCH(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (session.user.role !== "ADMIN") {
    return Response.json({ error: "Forbidden." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return Response.json({ error: "Invalid request body." }, { status: 422 });
  }

  // Handle ticker-only update
  if ("tickerSymbols" in body && Object.keys(body).length === 1) {
    const parsed = siteConfigSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { error: "Validation failed.", details: parsed.error.flatten() },
        { status: 422 },
      );
    }
    const config = await updateSiteConfig({ tickerSymbols: parsed.data.tickerSymbols });
    return Response.json({ config });
  }

  // Handle landing page config + expanded site fields update
  const parsedLanding = landingPageConfigSchema.safeParse(body);
  const config = await updateSiteConfig(
    parsedLanding.success
      ? parsedLanding.data
      : {
          accentColor: typeof body.accentColor === "string" ? body.accentColor : undefined,
          logoUrl: "logoUrl" in body ? (body.logoUrl as string | null) : undefined,
          faviconUrl: "faviconUrl" in body ? (body.faviconUrl as string | null) : undefined,
          platformName: typeof body.platformName === "string" ? body.platformName : undefined,
          supportEmail: "supportEmail" in body ? (body.supportEmail as string | null) : undefined,
          telegramLink: "telegramLink" in body ? (body.telegramLink as string | null) : undefined,
          twitterLink: "twitterLink" in body ? (body.twitterLink as string | null) : undefined,
          discordLink: "discordLink" in body ? (body.discordLink as string | null) : undefined,
          defaultTimezone: typeof body.defaultTimezone === "string" ? body.defaultTimezone : undefined,
          maintenanceMode:
            typeof body.maintenanceMode === "boolean" ? body.maintenanceMode : undefined,
          maintenanceMessage:
            "maintenanceMessage" in body ? (body.maintenanceMessage as string | null) : undefined,
        },
  );
  return Response.json({ config });
}
