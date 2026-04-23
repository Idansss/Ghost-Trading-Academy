import { auth } from "@/lib/auth";
import { getOnboardingSnapshot, markOnboardingStepComplete } from "@/lib/onboarding";
import { apiError, safeJson } from "@/lib/utils";
import { onboardingStepSchema } from "@/lib/validators";

// AUDIT FIX: All authenticated API routes must opt out of static rendering
export const dynamic = "force-dynamic";

export async function PATCH(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return apiError("Unauthorized.", 401);
  }

  try {
    const body = await safeJson<unknown>(request);
    const parsed = onboardingStepSchema.safeParse(body);

    // AUDIT FIX: Validation error shape changed from { message, errors } to
    // { error, details } for consistency with the global error format.
    if (!parsed.success) {
      return Response.json(
        { error: "Validation failed.", details: parsed.error.flatten() },
        { status: 422 },
      );
    }

    const updated = await markOnboardingStepComplete(session.user.id, parsed.data.step);
    const snapshot = getOnboardingSnapshot(
      updated.onboardingProgress,
      updated.onboardingCompleted,
    );

    return Response.json({ onboarding: snapshot });
  } catch (error) {
    if (error instanceof Error && error.message === "User not found") {
      return apiError("User not found.", 404);
    }
    return apiError("Unable to update onboarding.", 500);
  }
}
