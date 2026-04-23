import { Prisma } from "@prisma/client";
import { requireAdmin, requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiError, safeJson } from "@/lib/utils";
import { outlookSchema } from "@/lib/validators";

// AUDIT FIX: All authenticated API routes must opt out of static rendering
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await requireUser();

    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");

    const outlook = await prisma.dailyOutlook.findFirst({
      where: date ? { date: new Date(date) } : undefined,
      orderBy: { date: "desc" },
    });

    return Response.json({ outlook });
  } catch (error) {
    console.error(error);
    return apiError("Unable to load outlook.", 500);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAdmin();
    const body = await safeJson<unknown>(request);
    const parsed = outlookSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { error: "Validation failed.", details: parsed.error.flatten() },
        { status: 422 },
      );
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const outlook = await prisma.dailyOutlook.upsert({
      where: { date: today },
      update: {
        marketBias: parsed.data.marketBias,
        biasExplanation: parsed.data.biasExplanation,
        coinsToWatch: parsed.data.coinsToWatch as Prisma.InputJsonValue,
        levels: parsed.data.levels as Prisma.InputJsonValue,
        avoidToday: parsed.data.avoidToday as Prisma.InputJsonValue,
      },
      create: {
        date: today,
        marketBias: parsed.data.marketBias,
        biasExplanation: parsed.data.biasExplanation,
        coinsToWatch: parsed.data.coinsToWatch as Prisma.InputJsonValue,
        levels: parsed.data.levels as Prisma.InputJsonValue,
        avoidToday: parsed.data.avoidToday as Prisma.InputJsonValue,
        createdBy: user.id,
      },
    });

    return Response.json(outlook);
  } catch (error) {
    console.error(error);
    return apiError("Unable to save outlook.", 500);
  }
}
