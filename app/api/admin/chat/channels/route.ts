import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// AUDIT FIX: All authenticated API routes must opt out of static rendering
export const dynamic = "force-dynamic";

type AdminChatChannel = {
  id: string;
  name: string;
  slug: string;
  type: "GROUP" | "DM" | "ANNOUNCEMENT";
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
  _count: {
    messages: number;
    members: number;
  };
};

// AUDIT FIX: Admin moderation needs an all-channels endpoint that includes
// archived channels. The previous page reused the member-scoped chat endpoint.
export async function GET(): Promise<NextResponse<{ data: AdminChatChannel[] } | { error: string }>> {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const channels = await prisma.chatChannel.findMany({
      include: {
        _count: {
          select: {
            messages: true,
            members: true,
          },
        },
      },
      orderBy: [{ isArchived: "asc" }, { updatedAt: "desc" }],
    });

    return NextResponse.json({
      data: channels.map((channel) => ({
        id: channel.id,
        name: channel.name,
        slug: channel.slug,
        type: channel.type,
        isArchived: channel.isArchived,
        createdAt: channel.createdAt.toISOString(),
        updatedAt: channel.updatedAt.toISOString(),
        _count: channel._count,
      })),
    });
  } catch (error) {
    console.error("[admin/chat/channels GET]", error);
    return NextResponse.json({ error: "Unable to load admin chat channels." }, { status: 500 });
  }
}
