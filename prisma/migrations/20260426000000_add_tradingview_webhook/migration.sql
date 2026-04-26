-- CLAUDE FIX: TradingViewWebhook and WebhookLog tables were defined in schema.prisma
-- but never had a migration file, so the tables never existed in production.
-- This migration creates them so the /admin/integrations/tradingview page can function.

-- CreateEnum
CREATE TYPE "WebhookLogStatus" AS ENUM ('SUCCESS', 'INVALID_SECRET', 'INVALID_PAYLOAD', 'RATE_LIMITED', 'ERROR');

-- CreateTable
CREATE TABLE "TradingViewWebhook" (
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

-- CreateTable
CREATE TABLE "WebhookLog" (
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

-- CreateIndex
CREATE UNIQUE INDEX "TradingViewWebhook_userId_key" ON "TradingViewWebhook"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "TradingViewWebhook_webhookSecret_key" ON "TradingViewWebhook"("webhookSecret");

-- CreateIndex
CREATE INDEX "WebhookLog_webhookId_createdAt_idx" ON "WebhookLog"("webhookId", "createdAt");

-- AddForeignKey
ALTER TABLE "TradingViewWebhook" ADD CONSTRAINT "TradingViewWebhook_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WebhookLog" ADD CONSTRAINT "WebhookLog_webhookId_fkey" FOREIGN KEY ("webhookId") REFERENCES "TradingViewWebhook"("id") ON DELETE CASCADE ON UPDATE CASCADE;
