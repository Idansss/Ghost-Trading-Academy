import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiError, safeJson } from "@/lib/utils";
import { memberWinSchema } from "@/lib/validators";

// AUDIT FIX: All authenticated API routes must opt out of static rendering
export const dynamic = "force-dynamic";

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
  } catch (error) {
    console.error(error);
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
        { error: "Validation failed.", details: parsed.error.flatten() },
        { status: 422 },
      );
    }

    const win = await prisma.memberWin.create({
      data: {
        coin: parsed.data.coin,
        pnlPercent: parsed.data.pnlPercent,
        message: parsed.data.message,
        imageUrl: parsed.data.imageUrl ?? null,
        userId: user.id,
      },
    });

    return Response.json(win);
  } catch (error) {
    console.error(error);
    return apiError("Unable to share member win.", 500);
  }
}
