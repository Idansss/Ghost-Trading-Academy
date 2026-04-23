import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiError } from "@/lib/utils";

// AUDIT FIX: All authenticated API routes must opt out of static rendering
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();

  if (!session?.user) {
    return apiError("Unauthorized.", 401);
  }

  try {
    const tags = await prisma.tradeTag.findMany({
      orderBy: { name: "asc" },
    });

    return Response.json({ tags });
  } catch (error) {
    console.error(error);
    return apiError("Unable to load trade tags.", 500);
  }
}
