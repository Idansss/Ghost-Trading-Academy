import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiError } from "@/lib/utils";

// AUDIT FIX: All authenticated API routes must opt out of static rendering
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await requireUser();
    const [courses, completions, attempts, enrollments] = await Promise.all([
      prisma.course.findMany({
        where: user.role === "ADMIN" ? undefined : { isPublished: true },
        orderBy: { order: "asc" },
        include: {
          modules: {
            orderBy: { order: "asc" },
            include: {
              resources: true,
              quiz: {
                include: {
                  questions: true,
                },
              },
            },
          },
        },
      }),
      prisma.resourceCompletion.findMany({
        where: { userId: user.id },
        select: { resourceId: true },
      }),
      prisma.quizAttempt.findMany({
        where: { userId: user.id },
        orderBy: { takenAt: "desc" },
      }),
      prisma.courseEnrollment.findMany({
        where: { userId: user.id },
      }),
    ]);

    const completedResources = new Set(completions.map((entry) => entry.resourceId));
    const enrollmentMap = new Map(enrollments.map((entry) => [entry.courseId, entry]));
    const attemptsByQuiz = attempts.reduce<Record<string, typeof attempts[number][]>>((acc, attempt) => {
      acc[attempt.quizId] = [...(acc[attempt.quizId] ?? []), attempt];
      return acc;
    }, {});

    const payload = courses.map((course) => {
      const modules = course.modules.map((module) => {
        const completedResourceCount = module.resources.filter((resource) =>
          completedResources.has(resource.id),
        ).length;
        const quizAttempts = module.quiz ? attemptsByQuiz[module.quiz.id] ?? [] : [];
        const quizPassed = quizAttempts.some((attempt) => attempt.passed);
        return {
          ...module,
          resources: module.resources.map((resource) => ({
            ...resource,
            completedByMe: completedResources.has(resource.id),
          })),
          stats: {
            resourceCount: module.resources.length,
            completedResourceCount,
            quizPassed,
            bestQuizScore: quizAttempts.length
              ? Math.max(...quizAttempts.map((attempt) => attempt.score))
              : null,
          },
        };
      });

      const completedModuleCount = modules.filter(
        (module) =>
          module.stats.completedResourceCount === module.stats.resourceCount &&
          (!module.quiz || module.stats.quizPassed),
      ).length;
      return {
        ...course,
        modules,
        progress: {
          completedModules: completedModuleCount,
          totalModules: modules.length,
          percent: modules.length ? Math.round((completedModuleCount / modules.length) * 100) : 0,
        },
        enrollment: enrollmentMap.get(course.id) ?? null,
      };
    });

    return Response.json({ courses: payload });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return apiError("Unauthorized.", 401);
    }
    return apiError("Unable to load courses.", 500);
  }
}
