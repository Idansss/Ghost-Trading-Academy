import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { requireChannelAccess } from "@/lib/chat";
import { prisma } from "@/lib/prisma";
import type { ApiResponse } from "@/types/chat";

// AUDIT FIX: All authenticated API routes must opt out of static rendering
export const dynamic = "force-dynamic";

// AUDIT FIX: Read receipts now verify channel membership before updating and
// use the consistent { data } success envelope required by the chat API.
export async function PATCH(
  _request: Request,
  context: { params: Promise<{ channelId: string }> },
): Promise<NextResponse<ApiResponse<{ ok: true }> | { error: string }>> {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { channelId } = await context.params;
    const access = await requireChannelAccess(session.user.id, channelId);
    if (!access) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    await prisma.channelMember.update({
      where: {
        channelId_userId: {
          channelId,
          userId: session.user.id,
        },
      },
      data: {
        lastReadAt: new Date(),
      },
    });

    return NextResponse.json({ data: { ok: true } });
  } catch (error) {
    console.error("[chat/read PATCH]", error);
    return NextResponse.json({ error: "Unable to mark channel as read." }, { status: 500 });
  }
}
