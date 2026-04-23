import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// AUDIT FIX: Force dynamic rendering — this route uses headers() via auth() and cannot be statically rendered.
export const dynamic = "force-dynamic";

type SearchUser = {
  id: string;
  name: string;
  image: string | null;
};

// AUDIT FIX: User search now returns only the fields needed for DM search and
// always excludes the current user from results.
export async function GET(request: Request): Promise<NextResponse<{ data: { users: SearchUser[] } } | { error: string }>> {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const q = (searchParams.get("q") ?? "").trim();
    if (!q) {
      return NextResponse.json({ data: { users: [] } });
    }

    const users = await prisma.user.findMany({
      where: {
        id: { not: session.user.id },
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { email: { contains: q, mode: "insensitive" } },
        ],
      },
      select: { id: true, name: true, avatarUrl: true },
      take: 20,
    });

    return NextResponse.json({
      data: {
        users: users.map((user) => ({
          id: user.id,
          name: user.name,
          image: user.avatarUrl,
        })),
      },
    });
  } catch (error) {
    console.error("[users/search GET]", error);
    return NextResponse.json({ error: "Unable to search users." }, { status: 500 });
  }
}
