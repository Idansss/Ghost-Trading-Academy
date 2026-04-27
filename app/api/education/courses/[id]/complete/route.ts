// CLAUDE FIX: Course-level completion endpoint for handout PDFs — courses with
// no modules get marked complete when the user opens the course PDF.
import { requireUser } from "@/lib/auth";
import { markOnboardingStepComplete } from "@/lib/onboarding";
import { prisma } from "@/lib/prisma";
import { refreshUserDisciplineScore } from "@/lib/streak";
import { logUserActivity } from "@/lib/activity";
import { apiError } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireUser();
    const { id: courseId } = await params;

    await prisma.courseEnrollment.upsert({
      where: { courseId_userId: { courseId, userId: user.id } },
      create: { courseId, userId: user.id, completedAt: new Date() },
      update: { completedAt: new Date() },
    });

    await Promise.all([
      markOnboardingStepComplete(user.id, "FIRST_RESOURCE_COMPLETED"),
      refreshUserDisciplineScore(user.id),
      logUserActivity(user.id, "RESOURCE_COMPLETED"),
    ]);

    return Response.json({ completed: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return apiError("Unauthorized.", 401);
    }
    return apiError("Unable to mark course complete.", 500);
  }
}
