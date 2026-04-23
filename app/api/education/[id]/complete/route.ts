import { requireUser } from "@/lib/auth";
import { markOnboardingStepComplete } from "@/lib/onboarding";
import { sendNotification } from "@/lib/notify";
import { prisma } from "@/lib/prisma";
import { refreshUserDisciplineScore } from "@/lib/streak";
import { apiError } from "@/lib/utils";
import { logUserActivity } from "@/lib/activity";

// AUDIT FIX: All authenticated API routes must opt out of static rendering
export const dynamic = "force-dynamic";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireUser();
    const { id: resourceId } = await params;

    const existing = await prisma.resourceCompletion.findUnique({
      where: { userId_resourceId: { userId: user.id, resourceId } },
    });

    if (existing) {
      await prisma.resourceCompletion.delete({
        where: { userId_resourceId: { userId: user.id, resourceId } },
      });
      await refreshUserDisciplineScore(user.id);
      return Response.json({ completed: false });
    }

    await prisma.resourceCompletion.create({
      data: { userId: user.id, resourceId },
    });

    await Promise.all([
      markOnboardingStepComplete(user.id, "FIRST_RESOURCE_COMPLETED"),
      refreshUserDisciplineScore(user.id),
      logUserActivity(user.id, "RESOURCE_COMPLETED"),
    ]);

    const resource = await prisma.resource.findUnique({
      where: { id: resourceId },
      select: { moduleId: true },
    });

    if (resource?.moduleId) {
      const courseModule = await prisma.courseModule.findUnique({
        where: { id: resource.moduleId },
        include: {
          course: true,
          resources: { select: { id: true } },
          quiz: true,
        },
      });

      if (courseModule) {
        await prisma.courseEnrollment.upsert({
          where: {
            courseId_userId: {
              courseId: courseModule.courseId,
              userId: user.id,
            },
          },
          create: {
            courseId: courseModule.courseId,
            userId: user.id,
          },
          update: {},
        });

        const [allModules, completedResources, passedQuizAttempts] = await Promise.all([
          prisma.courseModule.findMany({
            where: { courseId: courseModule.courseId },
            include: {
              resources: { select: { id: true } },
              quiz: { select: { id: true } },
            },
          }),
          prisma.resourceCompletion.findMany({
            where: { userId: user.id },
            select: { resourceId: true },
          }),
          prisma.quizAttempt.findMany({
            where: { userId: user.id, passed: true },
            select: { quizId: true },
          }),
        ]);

        const completedResourcesSet = new Set(completedResources.map((entry) => entry.resourceId));
        const passedQuizSet = new Set(passedQuizAttempts.map((entry) => entry.quizId));
        const fullyCompleted = allModules.every((courseModule) => {
          const resourcesDone = courseModule.resources.every((entry) =>
            completedResourcesSet.has(entry.id),
          );
          const quizDone = !courseModule.quiz || passedQuizSet.has(courseModule.quiz.id);
          return resourcesDone && quizDone;
        });

        if (fullyCompleted) {
          const enrollment = await prisma.courseEnrollment.findUnique({
            where: {
              courseId_userId: {
                  courseId: courseModule.courseId,
                userId: user.id,
              },
            },
          });
          if (enrollment && !enrollment.completedAt) {
            await prisma.courseEnrollment.update({
              where: { id: enrollment.id },
              data: { completedAt: new Date() },
            });
            await sendNotification(user.id, "NEW_RESOURCE", {
              title: "Course completed",
              message: `You completed ${courseModule.course.title}. Download your certificate from education.`,
              link: "/education",
            });
          }
        }
      }
    }

    return Response.json({ completed: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return apiError("Unauthorized.", 401);
    }
    return apiError("Unable to update completion status.", 500);
  }
}
