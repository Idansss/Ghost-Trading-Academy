import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { DEFAULT_TICKER_SYMBOLS } from "@/lib/constants";

export type SiteConfigRecord = {
  id: string;
  tickerSymbols: string[];
  heroHeadline: string | null;
  heroSubheadline: string | null;
  ctaLabel: string;
  ctaUrl: string;
  isWaitlistMode: boolean;
  accentColor: string;
  logoUrl: string | null;
  faviconUrl: string | null;
  platformName: string;
  supportEmail: string | null;
  telegramLink: string | null;
  twitterLink: string | null;
  discordLink: string | null;
  defaultTimezone: string;
  maintenanceMode: boolean;
  maintenanceMessage: string | null;
  createdAt: Date;
  updatedAt: Date;
};

const DEFAULT_SITE_CONFIG: SiteConfigRecord = {
  id: "main",
  tickerSymbols: [...DEFAULT_TICKER_SYMBOLS],
  heroHeadline: null,
  heroSubheadline: null,
  ctaLabel: "Apply for Access",
  ctaUrl: "/auth/login",
  isWaitlistMode: false,
  accentColor: "#D4A017",
  logoUrl: null,
  faviconUrl: null,
  platformName: "The Thesis Desk",
  supportEmail: null,
  telegramLink: null,
  twitterLink: null,
  discordLink: null,
  defaultTimezone: "UTC",
  maintenanceMode: false,
  maintenanceMessage: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

function buildTickerSymbolsSql(tickerSymbols: string[]) {
  return Prisma.sql`ARRAY[${Prisma.join(
    tickerSymbols.map((symbol) => Prisma.sql`${symbol}`),
  )}]::TEXT[]`;
}

export async function getSiteConfig(): Promise<SiteConfigRecord> {
  const existing = await prisma.$queryRaw<SiteConfigRecord[]>`
    SELECT "id", "tickerSymbols", "heroHeadline", "heroSubheadline",
           "ctaLabel", "ctaUrl", "isWaitlistMode", "accentColor", "logoUrl",
           "faviconUrl", "platformName", "supportEmail", "telegramLink",
           "twitterLink", "discordLink", "defaultTimezone", "maintenanceMode",
           "maintenanceMessage", "createdAt", "updatedAt"
    FROM "SiteConfig"
    WHERE "id" = 'main'
    LIMIT 1
  `;

  if (existing[0]) {
    return existing[0];
  }

  await prisma.$executeRaw`
    INSERT INTO "SiteConfig" ("id", "tickerSymbols", "ctaLabel", "ctaUrl", "isWaitlistMode", "accentColor", "platformName", "defaultTimezone", "maintenanceMode", "createdAt", "updatedAt")
    VALUES ('main', ARRAY['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT', 'XRPUSDT']::TEXT[],
            'Apply for Access', '/auth/login', false, '#D4A017', 'The Thesis Desk', 'UTC', false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON CONFLICT ("id") DO NOTHING
  `;

  const created = await prisma.$queryRaw<SiteConfigRecord[]>`
    SELECT "id", "tickerSymbols", "heroHeadline", "heroSubheadline",
           "ctaLabel", "ctaUrl", "isWaitlistMode", "accentColor", "logoUrl",
           "faviconUrl", "platformName", "supportEmail", "telegramLink",
           "twitterLink", "discordLink", "defaultTimezone", "maintenanceMode",
           "maintenanceMessage", "createdAt", "updatedAt"
    FROM "SiteConfig"
    WHERE "id" = 'main'
    LIMIT 1
  `;

  return created[0] ?? DEFAULT_SITE_CONFIG;
}

export async function updateSiteConfig(
  data: Partial<{
    tickerSymbols: string[];
    heroHeadline: string | null;
    heroSubheadline: string | null;
    ctaLabel: string;
    ctaUrl: string;
    isWaitlistMode: boolean;
    accentColor: string;
    logoUrl: string | null;
    faviconUrl: string | null;
    platformName: string;
    supportEmail: string | null;
    telegramLink: string | null;
    twitterLink: string | null;
    discordLink: string | null;
    defaultTimezone: string;
    maintenanceMode: boolean;
    maintenanceMessage: string | null;
  }>,
): Promise<SiteConfigRecord | undefined> {
  const current = await getSiteConfig();

  const tickerSymbols = data.tickerSymbols ?? current.tickerSymbols;
  const heroHeadline = "heroHeadline" in data ? data.heroHeadline : current.heroHeadline;
  const heroSubheadline =
    "heroSubheadline" in data ? data.heroSubheadline : current.heroSubheadline;
  const ctaLabel = data.ctaLabel ?? current.ctaLabel;
  const ctaUrl = data.ctaUrl ?? current.ctaUrl;
  const isWaitlistMode = data.isWaitlistMode ?? current.isWaitlistMode;
  const accentColor = data.accentColor ?? current.accentColor;
  const logoUrl = "logoUrl" in data ? data.logoUrl : current.logoUrl;
  const faviconUrl = "faviconUrl" in data ? data.faviconUrl : current.faviconUrl;
  const platformName = data.platformName ?? current.platformName;
  const supportEmail = "supportEmail" in data ? data.supportEmail : current.supportEmail;
  const telegramLink = "telegramLink" in data ? data.telegramLink : current.telegramLink;
  const twitterLink = "twitterLink" in data ? data.twitterLink : current.twitterLink;
  const discordLink = "discordLink" in data ? data.discordLink : current.discordLink;
  const defaultTimezone = data.defaultTimezone ?? current.defaultTimezone;
  const maintenanceMode = data.maintenanceMode ?? current.maintenanceMode;
  const maintenanceMessage =
    "maintenanceMessage" in data ? data.maintenanceMessage : current.maintenanceMessage;

  const tickerSymbolsSql = buildTickerSymbolsSql(tickerSymbols);

  await prisma.$executeRaw`
    INSERT INTO "SiteConfig" ("id", "tickerSymbols", "heroHeadline", "heroSubheadline",
                              "ctaLabel", "ctaUrl", "isWaitlistMode", "accentColor", "logoUrl",
                              "faviconUrl", "platformName", "supportEmail", "telegramLink",
                              "twitterLink", "discordLink", "defaultTimezone", "maintenanceMode",
                              "maintenanceMessage", "createdAt", "updatedAt")
    VALUES ('main', ${tickerSymbolsSql}, ${heroHeadline}, ${heroSubheadline},
            ${ctaLabel}, ${ctaUrl}, ${isWaitlistMode}, ${accentColor}, ${logoUrl},
            ${faviconUrl}, ${platformName}, ${supportEmail}, ${telegramLink},
            ${twitterLink}, ${discordLink}, ${defaultTimezone}, ${maintenanceMode},
            ${maintenanceMessage}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON CONFLICT ("id")
    DO UPDATE SET
      "tickerSymbols"   = ${tickerSymbolsSql},
      "heroHeadline"    = ${heroHeadline},
      "heroSubheadline" = ${heroSubheadline},
      "ctaLabel"        = ${ctaLabel},
      "ctaUrl"          = ${ctaUrl},
      "isWaitlistMode"  = ${isWaitlistMode},
      "accentColor"     = ${accentColor},
      "logoUrl"         = ${logoUrl},
      "faviconUrl"      = ${faviconUrl},
      "platformName"    = ${platformName},
      "supportEmail"    = ${supportEmail},
      "telegramLink"    = ${telegramLink},
      "twitterLink"     = ${twitterLink},
      "discordLink"     = ${discordLink},
      "defaultTimezone" = ${defaultTimezone},
      "maintenanceMode" = ${maintenanceMode},
      "maintenanceMessage" = ${maintenanceMessage},
      "updatedAt"       = CURRENT_TIMESTAMP
  `;

  const updated = await prisma.$queryRaw<SiteConfigRecord[]>`
    SELECT "id", "tickerSymbols", "heroHeadline", "heroSubheadline",
           "ctaLabel", "ctaUrl", "isWaitlistMode", "accentColor", "logoUrl",
           "faviconUrl", "platformName", "supportEmail", "telegramLink",
           "twitterLink", "discordLink", "defaultTimezone", "maintenanceMode",
           "maintenanceMessage", "createdAt", "updatedAt"
    FROM "SiteConfig"
    WHERE "id" = 'main'
    LIMIT 1
  `;

  return updated[0];
}
