import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// AUDIT FIX: Force dynamic rendering — this route uses headers() via auth() and cannot be statically rendered.
export const dynamic = "force-dynamic";

type SearchResult = {
  id: string;
  channelId: string;
  channelName: string;
  body: string | null;
  imageUrl: string | null;
  deletedAt: string | null;
  createdAt: string;
  author: {
    id: string;
    name: string;
  };
};

// AUDIT FIX: Admin chat search now returns a moderation-friendly payload with
// author, timestamp, channel, and delete state while preserving case-insensitive
// body contains matching.
export async function GET(request: Request): Promise<NextResponse<{ data: { messages: SearchResult[] } } | { error: string }>> {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const q = (searchParams.get("q") ?? "").trim();
    const channelId = searchParams.get("channelId") ?? undefined;

    if (!q) {
      return NextResponse.json({ data: { messages: [] } });
    }

    const messages = await prisma.chatMessage.findMany({
      where: {
        body: { contains: q, mode: "insensitive" },
        ...(channelId ? { channelId } : {}),
      },
      include: {
        author: { select: { id: true, name: true } },
        channel: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return NextResponse.json({
      data: {
        messages: messages.map((message) => ({
          id: message.id,
          channelId: message.channelId,
          channelName: message.channel.name,
          body: message.body,
          imageUrl: message.imageUrl,
          deletedAt: message.deletedAt?.toISOString() ?? null,
          createdAt: message.createdAt.toISOString(),
          author: {
            id: message.author.id,
            name: message.author.name,
          },
        })),
      },
    });
  } catch (error) {
    console.error("[admin/chat/search GET]", error);
    return NextResponse.json({ error: "Unable to search messages." }, { status: 500 });
  }
}
