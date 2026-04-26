// CLAUDE IMPROVEMENT: GET /api/admin/tradingview/webhook
// Returns the caller's webhook config, creating one on first access so the admin
// never has to manually initialise — the page just loads and shows the URL.
import { generateWebhookSecret } from "@/lib/webhooks/generateSecret";
import { prisma } from "@/lib/prisma";
import { requireAdminUser } from "@/server/core/auth";
import { createRouteHandler } from "@/server/core/route";
import { success } from "@/server/core/http";

export const dynamic = "force-dynamic";

export const GET = createRouteHandler(async () => {
  const admin = await requireAdminUser();

  let webhook = await prisma.tradingViewWebhook.findUnique({
    where: { userId: admin.id },
    select: {
      id: true,
      webhookSecret: true,
      isActive: true,
      lastTriggeredAt: true,
      triggerCount: true,
      createdAt: true,
    },
  });

  // Auto-create on first visit so the admin sees a working URL immediately.
  if (!webhook) {
    webhook = await prisma.tradingViewWebhook.create({
      data: {
        userId: admin.id,
        webhookSecret: generateWebhookSecret(),
      },
      select: {
        id: true,
        webhookSecret: true,
        isActive: true,
        lastTriggeredAt: true,
        triggerCount: true,
        createdAt: true,
      },
    });
  }

  return success(webhook);
});
