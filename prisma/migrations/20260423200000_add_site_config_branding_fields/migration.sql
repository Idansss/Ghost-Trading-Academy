-- AlterTable: Add branding and maintenance fields to SiteConfig
ALTER TABLE "SiteConfig" 
  ADD COLUMN IF NOT EXISTS "logoUrl" TEXT,
  ADD COLUMN IF NOT EXISTS "faviconUrl" TEXT,
  ADD COLUMN IF NOT EXISTS "platformName" TEXT NOT NULL DEFAULT 'Ghost Trading Academy',
  ADD COLUMN IF NOT EXISTS "supportEmail" TEXT,
  ADD COLUMN IF NOT EXISTS "telegramLink" TEXT,
  ADD COLUMN IF NOT EXISTS "twitterLink" TEXT,
  ADD COLUMN IF NOT EXISTS "discordLink" TEXT,
  ADD COLUMN IF NOT EXISTS "defaultTimezone" TEXT NOT NULL DEFAULT 'UTC',
  ADD COLUMN IF NOT EXISTS "maintenanceMode" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "maintenanceMessage" TEXT;
