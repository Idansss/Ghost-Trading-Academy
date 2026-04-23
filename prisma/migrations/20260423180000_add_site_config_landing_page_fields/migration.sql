-- AlterTable
ALTER TABLE "SiteConfig" ADD COLUMN IF NOT EXISTS "heroHeadline" TEXT,
                         ADD COLUMN IF NOT EXISTS "heroSubheadline" TEXT,
                         ADD COLUMN IF NOT EXISTS "ctaLabel" TEXT NOT NULL DEFAULT 'Apply for Access',
                         ADD COLUMN IF NOT EXISTS "ctaUrl" TEXT NOT NULL DEFAULT '/auth/login',
                         ADD COLUMN IF NOT EXISTS "isWaitlistMode" BOOLEAN NOT NULL DEFAULT false;
