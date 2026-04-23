import { subDays } from "date-fns";
import { BroadcastChannel, Role } from "@prisma/client";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiError, safeJson } from "@/lib/utils";
import { sanitizeHtml } from "@/lib/sanitize";
import { sendNotification } from "@/lib/notify";
import { sendPushNotification } from "@/lib/onesignal";
import { sendBroadcastEmail } from "@/lib/email";
import { env } from "@/lib/env";
import { logAdminAction } from "@/lib/audit-log";

// AUDIT FIX: All authenticated API routes must opt out of static rendering
export const dynamic = "force-dynamic";

type Targeting =
  | { type: "ALL_MEMBERS" }
  | { type: "BY_ROLE"; role: Role }
  | { type: "JOINED_LAST_30_DAYS" }
  | { type: "NO_TRADE_14_DAYS" };

async function getRecipients(targeting: Targeting) {
  if (targeting.type === "ALL_MEMBERS") {
    return prisma.user.findMany({
      where: { role: { in: ["MEMBER", "VIP"] } },
    });
  }
  if (targeting.type === "BY_ROLE") {
    return prisma.user.findMany({ where: { role: targeting.role } });
  }
  if (targeting.type === "JOINED_LAST_30_DAYS") {
    return prisma.user.findMany({
      where: { createdAt: { gte: subDays(new Date(), 30) } },
    });
  }
  return prisma.user.findMany({
    where: {
      role: { in: ["MEMBER", "VIP"] },
      trades: {
        none: {
          tradeDate: { gte: subDays(new Date(), 14) },
        },
      },
    },
  });
}

export async function GET() {
  try {
    await requireAdmin();
    const broadcasts = await prisma.broadcastMessage.findMany({
      orderBy: { sentAt: "desc" },
      take: 100,
    });
    const openCounts = await prisma.$queryRaw<Array<{ entityId: string; opened: bigint }>>`
      SELECT "entityId", COUNT(DISTINCT ("metadata"->>'email'))::bigint AS opened
      FROM "AuditLog"
      WHERE "action" = 'BROADCAST_EMAIL_OPEN'
      GROUP BY "entityId"
    `;
    const openMap = new Map(openCounts.map((entry) => [entry.entityId, Number(entry.opened)]));

    return Response.json({
      broadcasts: broadcasts.map((broadcast) => {
        const opened = openMap.get(broadcast.id) ?? 0;
        return {
          ...broadcast,
          openRate: broadcast.recipientCount
            ? (opened / broadcast.recipientCount) * 100
            : 0,
          emailOpenCount: opened,
        };
      }),
    });
  } catch (error) {
    console.error(error);
    return apiError("Unable to load broadcast history.", 500);
  }
}

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin();
    const body = await safeJson<{
      subject: string;
      body: string;
      targeting: Targeting;
      channels: BroadcastChannel[];
      sendTest?: boolean;
      dryRun?: boolean;
    }>(request);

    const sanitizedBody = sanitizeHtml(body.body);
    const recipients = body.sendTest
      ? [await prisma.user.findUnique({ where: { id: admin.id } })].filter(Boolean)
      : await getRecipients(body.targeting);

    if (body.dryRun) {
      return Response.json({ recipientCount: recipients.length });
    }

    const broadcast = await prisma.broadcastMessage.create({
      data: {
        subject: body.subject,
        body: sanitizedBody,
        sentVia: body.channels,
        sentBy: admin.id,
        recipientCount: recipients.length,
      },
    });

    if (body.channels.includes("IN_APP")) {
      await Promise.all(
        recipients.map((recipient) =>
          sendNotification(recipient!.id, "BROADCAST", {
            title: body.subject,
            message: sanitizedBody.replace(/<[^>]+>/g, "").slice(0, 200),
            link: "/notifications",
          }),
        ),
      );
    }

    if (body.channels.includes("EMAIL")) {
      await Promise.all(
        recipients.map((recipient) =>
          sendBroadcastEmail({
            to: recipient!.email,
            subject: body.subject,
            bodyHtml: sanitizedBody,
            trackingPixelUrl: `${env.publicAppUrl}/api/broadcast/open?broadcastId=${broadcast.id}&email=${encodeURIComponent(recipient!.email)}&adminId=${admin.id}`,
          }),
        ),
      );
    }

    if (body.channels.includes("PUSH")) {
      await sendPushNotification({
        externalIds: recipients.map((recipient) => recipient!.id),
        headings: { en: body.subject },
        contents: { en: sanitizedBody.replace(/<[^>]+>/g, "").slice(0, 140) },
        url: `${env.publicAppUrl}/notifications`,
      });
    }

    await logAdminAction({
      userId: admin.id,
      action: body.sendTest ? "BROADCAST_TEST_SENT" : "BROADCAST_SENT",
      entity: "BroadcastMessage",
      entityId: broadcast.id,
      metadata: {
        recipientCount: recipients.length,
        channels: body.channels,
        targeting: body.targeting,
      },
    });

    return Response.json({ broadcast });
  } catch (error) {
    if (error instanceof Error && error.message === "Forbidden") {
      return apiError("Forbidden.", 403);
    }
    return apiError("Unable to send broadcast.", 500);
  }
}
