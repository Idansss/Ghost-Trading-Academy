import { requireUser } from "@/lib/auth";
import { markOnboardingStepComplete } from "@/lib/onboarding";
import { prisma } from "@/lib/prisma";
import { refreshUserDisciplineScore } from "@/lib/streak";
import { logUserActivity } from "@/lib/activity";
import { apiError } from "@/lib/utils";

// AUDIT FIX: All authenticated API routes must opt out of static rendering
export const dynamic = "force-dynamic";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireUser();
    const { id: signalId } = await params;

    await prisma.signalView.upsert({
      where: { userId_signalId: { userId: user.id, signalId } },
      update: {
        viewedAt: new Date(),
      },
      create: {
        userId: user.id,
        signalId,
      },
    });

    await Promise.all([
      markOnboardingStepComplete(user.id, "FIRST_SIGNAL_VIEWED"),
      refreshUserDisciplineScore(user.id),
      logUserActivity(user.id, "SIGNAL_VIEWED"),
    ]);

    return Response.json({ viewed: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return apiError("Unauthorized.", 401);
    }

    return apiError("Unable to record signal view.", 500);
  }
}
