import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiError, safeJson } from "@/lib/utils";

// AUDIT FIX: All authenticated API routes must opt out of static rendering
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await requireUser();
    const items = await prisma.watchlistItem.findMany({
      where: { userId: user.id },
      orderBy: { addedAt: "desc" },
    });
    return Response.json({ items });
  } catch (error) {
    console.error(error);
    return apiError("Unable to load watchlist.", 500);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = await safeJson<{ symbol?: string; notes?: string; alertPrice?: number | null }>(request);
    if (!body.symbol) return apiError("Symbol is required.", 400);
    const item = await prisma.watchlistItem.upsert({
      where: {
        userId_symbol: {
          userId: user.id,
          symbol: body.symbol.toUpperCase(),
        },
      },
      update: {
        notes: body.notes ?? null,
        alertPrice: body.alertPrice ?? null,
      },
      create: {
        userId: user.id,
        symbol: body.symbol.toUpperCase(),
        notes: body.notes ?? null,
        alertPrice: body.alertPrice ?? null,
      },
    });
    return Response.json(item);
  } catch (error) {
    console.error(error);
    return apiError("Unable to save watchlist item.", 500);
  }
}
