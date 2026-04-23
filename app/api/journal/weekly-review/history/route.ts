import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiError } from "@/lib/utils";

// AUDIT FIX: All authenticated API routes must opt out of static rendering
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await requireUser();
    const reviews = await prisma.weeklyReview.findMany({
      where: { userId: user.id },
      orderBy: { weekStartDate: "desc" },
    });
    return Response.json({ reviews });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return apiError("Unauthorized.", 401);
    }
    return apiError("Unable to load weekly review history.", 500);
  }
}
