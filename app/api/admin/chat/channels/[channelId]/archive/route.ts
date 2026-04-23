import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// AUDIT FIX: All authenticated API routes must opt out of static rendering
export const dynamic = "force-dynamic";

// AUDIT FIX: Channel archiving now returns proper 401/403 responses instead of
// collapsing auth failures into 500s, and preserves messages by toggling only
// the archive flag.
// AUDIT FIX: Route previously only set isArchived: true (one-way). It is now a
// toggle — a second PATCH call on an archived channel will unarchive it.
export async function PATCH(
  _request: Request,
  context: { params: Promise<{ channelId: string }> },
): Promise<NextResponse<{ data: { id: string; isArchived: boolean } } | { error: string }>> {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const { channelId } = await context.params;

    const existing = await prisma.chatChannel.findUnique({
      where: { id: channelId },
      select: { id: true, isArchived: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Channel not found." }, { status: 404 });
    }

    const channel = await prisma.chatChannel.update({
      where: { id: channelId },
      data: { isArchived: !existing.isArchived },
      select: { id: true, isArchived: true },
    });

    return NextResponse.json({ data: channel });
  } catch (error) {
    console.error("[admin/chat/archive PATCH]", error);
    return NextResponse.json({ error: "Unable to toggle archive status." }, { status: 500 });
  }
}
