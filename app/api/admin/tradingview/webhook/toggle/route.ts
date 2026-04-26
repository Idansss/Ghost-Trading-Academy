// CLAUDE IMPROVEMENT: PATCH /api/admin/tradingview/webhook/toggle
// Flips isActive. When inactive, all incoming webhooks with this secret get 401.
import { prisma } from "@/lib/prisma";
import { requireAdminUser } from "@/server/core/auth";
import { AppError } from "@/server/core/app-error";
import { createRouteHandler } from "@/server/core/route";
import { success } from "@/server/core/http";

export const dynamic = "force-dynamic";

export const PATCH = createRouteHandler(async () => {
  const admin = await requireAdminUser();

  const existing = await prisma.tradingViewWebhook.findUnique({
    where: { userId: admin.id },
    select: { id: true, isActive: true },
  });

  if (!existing) {
    throw AppError.notFound("TradingViewWebhook", admin.id);
  }

  const webhook = await prisma.tradingViewWebhook.update({
    where: { id: existing.id },
    data: { isActive: !existing.isActive },
    select: {
      id: true,
      isActive: true,
      webhookSecret: true,
      lastTriggeredAt: true,
      triggerCount: true,
    },
  });

  return success(webhook);
});
