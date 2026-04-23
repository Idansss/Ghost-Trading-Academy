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

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } },
) {
  const session = await auth();
  const accessError = assertAdmin(session);

  if (accessError) {
    return accessError;
  }

  try {
    const body = await safeJson<unknown>(request);
    const parsed = tradeTagSchema.safeParse(body);

    // AUDIT FIX: Validation error shape changed from { message, errors } to
    // { error, details } for consistency with the global error format.
    if (!parsed.success) {
      return Response.json(
        { error: "Validation failed.", details: parsed.error.flatten() },
        { status: 422 },
      );
    }

    const tag = await prisma.tradeTag.update({
      where: { id: params.id },
      data: parsed.data,
    });

    return Response.json(tag);
  } catch (error) {
    console.error(error);
    return apiError("Unable to update tag.", 500);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const session = await auth();
  const accessError = assertAdmin(session);

  if (accessError) {
    return accessError;
  }

  try {
    await prisma.tradeTag.delete({
      where: { id: params.id },
    });

    return Response.json({ ok: true });
  } catch (error) {
    console.error(error);
    return apiError("Unable to delete tag.", 500);
  }
}
