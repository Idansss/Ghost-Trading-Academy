import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiError, safeJson } from "@/lib/utils";
import { pushSubscriptionSchema } from "@/lib/validators";

// AUDIT FIX: All authenticated API routes must opt out of static rendering
export const dynamic = "force-dynamic";

export async function PATCH(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return apiError("Unauthorized.", 401);
  }

  try {
    const body = await safeJson<unknown>(request);
    const parsed = pushSubscriptionSchema.safeParse(body);

    // AUDIT FIX: Validation error shape changed from { message, errors } to
    // { error, details } for consistency with the global error format.
    if (!parsed.success) {
      return Response.json(
        { error: "Validation failed.", details: parsed.error.flatten() },
        { status: 422 },
      );
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        pushPlayerId: parsed.data.pushPlayerId,
      },
    });

    return Response.json({ ok: true });
  } catch (error) {
    console.error(error);
    return apiError("Unable to update push subscription.", 500);
  }
}
