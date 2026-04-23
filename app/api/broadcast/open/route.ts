import { prisma } from "@/lib/prisma";

// AUDIT FIX: All authenticated API routes must opt out of static rendering
export const dynamic = "force-dynamic";

const pixel = Uint8Array.from([
  71, 73, 70, 56, 57, 97, 1, 0, 1, 0, 128, 0, 0, 0, 0, 0, 255, 255, 255, 33,
  249, 4, 1, 10, 0, 1, 0, 44, 0, 0, 0, 0, 1, 0, 1, 0, 0, 2, 2, 76, 1, 0, 59,
]);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const broadcastId = searchParams.get("broadcastId");
  const email = searchParams.get("email");
  const adminId = searchParams.get("adminId");
  if (broadcastId && email && adminId) {
    await prisma.auditLog.create({
      data: {
        userId: adminId,
        action: "BROADCAST_EMAIL_OPEN",
        entity: "BroadcastMessage",
        entityId: broadcastId,
        metadata: { email },
      },
    }).catch(() => {});
  }
  return new Response(pixel, {
    headers: {
      "Content-Type": "image/gif",
      "Cache-Control": "no-store, no-cache, must-revalidate",
    },
  });
}
