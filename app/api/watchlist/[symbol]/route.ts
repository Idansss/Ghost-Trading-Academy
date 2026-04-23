import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiError } from "@/lib/utils";

// AUDIT FIX: All authenticated API routes must opt out of static rendering
export const dynamic = "force-dynamic";

export async function DELETE(
  _request: Request,
  { params }: { params: { symbol: string } },
) {
  try {
    const user = await requireUser();
    await prisma.watchlistItem.delete({
      where: {
        userId_symbol: {
          userId: user.id,
          symbol: params.symbol.toUpperCase(),
        },
      },
    });
    return Response.json({ ok: true });
  } catch (error) {
    console.error(error);
    return apiError("Unable to remove watchlist item.", 500);
  }
}
