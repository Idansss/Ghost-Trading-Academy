// CLAUDE IMPROVEMENT: GET /api/admin/tradingview/webhook/logs?limit=50
// Returns the most recent webhook events for this admin's webhook so they can
// debug TradingView alert issues without needing database access.
import { prisma } from "@/lib/prisma";
import { requireAdminUser } from "@/server/core/auth";
import { AppError } from "@/server/core/app-error";
import { createRouteHandler } from "@/server/core/route";
import { success } from "@/server/core/http";

export const dynamic = "force-dynamic";

export const GET = createRouteHandler(async ({ request }) => {
  const admin = await requireAdminUser();

  const url = new URL(request.url);
  const limit = Math.min(Number(url.searchParams.get("limit") ?? "50"), 100);

  const webhook = await prisma.tradingViewWebhook.findUnique({
    where: { userId: admin.id },
    select: { id: true },
  });

  if (!webhook) {
    throw AppError.notFound("TradingViewWebhook", admin.id);
  }

  const logs = await prisma.webhookLog.findMany({
    where: { webhookId: webhook.id },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      status: true,
      signalId: true,
      errorMessage: true,
      ipAddress: true,
      createdAt: true,
    },
  });

  return success({ logs });
});
