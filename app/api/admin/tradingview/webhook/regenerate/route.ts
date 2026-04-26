// CLAUDE IMPROVEMENT: POST /api/admin/tradingview/webhook/regenerate
// Rotates the webhook secret. The old secret is immediately invalid — any
// TradingView alerts using it will return 401 until the admin updates their alert.
import { generateWebhookSecret } from "@/lib/webhooks/generateSecret";
import { prisma } from "@/lib/prisma";
import { requireAdminUser } from "@/server/core/auth";
import { createRouteHandler } from "@/server/core/route";
import { success } from "@/server/core/http";

export const dynamic = "force-dynamic";

export const POST = createRouteHandler(async () => {
  const admin = await requireAdminUser();

  const newSecret = generateWebhookSecret();

  const webhook = await prisma.tradingViewWebhook.upsert({
    where: { userId: admin.id },
    create: {
      userId: admin.id,
      webhookSecret: newSecret,
    },
    update: {
      webhookSecret: newSecret,
    },
    select: {
      id: true,
      webhookSecret: true,
      isActive: true,
      lastTriggeredAt: true,
      triggerCount: true,
    },
  });

  return success(webhook);
});
