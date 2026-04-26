-- CLAUDE FIX: TradingViewWebhook and WebhookLog tables were defined in schema.prisma
-- but never had a migration file, so the tables never existed in production.
-- Made idempotent after initial apply failed because the enum already existed
-- (created via a prior prisma db push). Every statement is now safe to re-run.

-- CreateEnum (idempotent)
DO $$ BEGIN
    CREATE TYPE "WebhookLogStatus" AS ENUM ('SUCCESS', 'INVALID_SECRET', 'INVALID_PAYLOAD', 'RATE_LIMITED', 'ERROR');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CreateTable (idempotent)
CREATE TABLE IF NOT EXISTS "TradingViewWebhook" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "webhookSecret" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastTriggeredAt" TIMESTAMP(3),
    "triggerCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TradingViewWebhook_pkey" PRIMARY KEY ("id")
);

-- CreateTable (idempotent)
CREATE TABLE IF NOT EXISTS "WebhookLog" (
    "id" TEXT NOT NULL,
    "webhookId" TEXT NOT NULL,
    "status" "WebhookLogStatus" NOT NULL,
    "payload" JSONB NOT NULL,
    "signalId" TEXT,
    "errorMessage" TEXT,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WebhookLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex (idempotent)
CREATE UNIQUE INDEX IF NOT EXISTS "TradingViewWebhook_userId_key" ON "TradingViewWebhook"("userId");
CREATE UNIQUE INDEX IF NOT EXISTS "TradingViewWebhook_webhookSecret_key" ON "TradingViewWebhook"("webhookSecret");
CREATE INDEX IF NOT EXISTS "WebhookLog_webhookId_createdAt_idx" ON "WebhookLog"("webhookId", "createdAt");

-- AddForeignKey (idempotent — silently skips if constraint already exists)
DO $$ BEGIN
    ALTER TABLE "TradingViewWebhook" ADD CONSTRAINT "TradingViewWebhook_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "WebhookLog" ADD CONSTRAINT "WebhookLog_webhookId_fkey" FOREIGN KEY ("webhookId") REFERENCES "TradingViewWebhook"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
