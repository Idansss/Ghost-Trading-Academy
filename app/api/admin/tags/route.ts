import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiError, safeJson } from "@/lib/utils";
import { tradeTagSchema } from "@/lib/validators";
import type { Session } from "next-auth";

// AUDIT FIX: All authenticated API routes must opt out of static rendering
export const dynamic = "force-dynamic";

function assertAdmin(session: Session | null) {
  if (!session?.user) {
    return apiError("Unauthorized.", 401);
  }

  if (session.user.role !== "ADMIN") {
    return apiError("Forbidden.", 403);
  }

  return null;
}

export async function GET() {
  const session = await auth();
  const accessError = assertAdmin(session);

  if (accessError) {
    return accessError;
  }

  try {
    const tags = await prisma.tradeTag.findMany({
      orderBy: { name: "asc" },
    });

    return Response.json({ tags });
  } catch (error) {
    console.error(error);
    return apiError("Unable to load tags.", 500);
  }
}

export async function POST(request: Request) {
  const session = await auth();
  const accessError = assertAdmin(session);

  if (accessError) {
    return accessError;
  }

  try {
    const body = await safeJson<unknown>(request);
    const parsed = tradeTagSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { error: "Validation failed.", details: parsed.error.flatten() },
        { status: 422 },
      );
    }

    const tag = await prisma.tradeTag.create({
      data: parsed.data,
    });

    return Response.json(tag);
  } catch (error) {
    console.error(error);
    return apiError("Unable to create tag.", 500);
  }
}
