import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiError, safeJson } from "@/lib/utils";

// AUDIT FIX: All authenticated API routes must opt out of static rendering
export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireUser();
    const resolvedParams = await params;
    const body = await safeJson<{ answers?: number[] }>(request);
    const answers = body.answers ?? [];

    const courseModule = await prisma.courseModule.findUnique({
      where: { id: resolvedParams.id },
      include: {
        course: true,
        quiz: { include: { questions: true } },
      },
    });
    if (!courseModule || !courseModule.quiz) {
      return apiError("Quiz not found.", 404);
    }
    const questions = courseModule.quiz.questions;
    if (!questions.length) {
      return apiError("Quiz has no questions.", 400);
    }

    let correct = 0;
    questions.forEach((question, index) => {
      if ((answers[index] ?? -1) === question.correctIndex) {
        correct += 1;
      }
    });
    const score = Math.round((correct / questions.length) * 100);
    const passed = score >= 70;

    const attempt = await prisma.quizAttempt.create({
      data: {
        quizId: courseModule.quiz.id,
        userId: user.id,
        score,
        passed,
        answers,
      },
    });

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

    return Response.json(attempt);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return apiError("Unauthorized.", 401);
    }
    return apiError("Unable to submit quiz attempt.", 500);
  }
}
