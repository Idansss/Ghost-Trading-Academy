import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiError, safeJson } from "@/lib/utils";
import { memberWinSchema } from "@/lib/validators";

export async function GET(request: Request) {
  try {
    const user = await requireUser();
    const { searchParams } = new URL(request.url);
    const adminAll = searchParams.get("all") === "true" && user.role === "ADMIN";

    const wins = await prisma.memberWin.findMany({
      where: adminAll ? undefined : { isApproved: true },
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            name: true,
            avatarUrl: true,
          },
        },
      },
      take: adminAll ? 100 : 30,
    });
    return Response.json({ wins });
  } catch {
    return apiError("Unable to load member wins.", 500);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = await safeJson<unknown>(request);
    const parsed = memberWinSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { message: "Invalid member win payload.", errors: parsed.error.flatten().fieldErrors },
        { status: 422 },
      );
    }

    const win = await prisma.memberWin.create({
      data: {
        ...parsed.data,
        userId: user.id,
      },
    });

    return Response.json(win);
  } catch {
    return apiError("Unable to share member win.", 500);
  }
}
