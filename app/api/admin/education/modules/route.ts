import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiError, safeJson } from "@/lib/utils";
import { logAdminAction } from "@/lib/audit-log";

// AUDIT FIX: All authenticated API routes must opt out of static rendering
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin();
    const body = await safeJson<{
      courseId: string;
      title: string;
      order?: number;
      resourceIds?: string[];
      quizQuestions?: Array<{
        question: string;
        options: string[];
        correctIndex: number;
        explanation?: string;
      }>;
    }>(request);

    const maxOrder = await prisma.courseModule.aggregate({
      where: { courseId: body.courseId },
      _max: { order: true },
    });

    const createdModule = await prisma.courseModule.create({
      data: {
        courseId: body.courseId,
        title: body.title,
        order: body.order ?? (maxOrder._max.order ?? 0) + 1,
      },
    });

    if (body.resourceIds?.length) {
      await prisma.resource.updateMany({
        where: { id: { in: body.resourceIds } },
        data: { moduleId: createdModule.id },
      });
    }

    if (body.quizQuestions?.length) {
      const quiz = await prisma.quiz.create({
        data: { moduleId: createdModule.id },
      });
      await prisma.quizQuestion.createMany({
        data: body.quizQuestions.map((question) => ({
          quizId: quiz.id,
          question: question.question,
          options: question.options,
          correctIndex: question.correctIndex,
          explanation: question.explanation ?? null,
        })),
      });
    }

    await logAdminAction({
      userId: admin.id,
      action: "COURSE_MODULE_CREATED",
      entity: "CourseModule",
      entityId: createdModule.id,
    });

    return Response.json(createdModule);
  } catch (error) {
    console.error(error);
    return apiError("Unable to create course module.", 500);
  }
}

export async function PATCH(request: Request) {
  try {
    const admin = await requireAdmin();
    const body = await safeJson<{
      moduleId: string;
      title?: string;
      order?: number;
      resourceIds?: string[];
      quizQuestions?: Array<{
        id?: string;
        question: string;
        options: string[];
        correctIndex: number;
        explanation?: string;
      }>;
    }>(request);

    const updated = await prisma.courseModule.update({
      where: { id: body.moduleId },
      data: {
        ...(body.title !== undefined ? { title: body.title } : {}),
        ...(body.order !== undefined ? { order: body.order } : {}),
      },
      include: { quiz: true },
    });

    if (body.resourceIds) {
      await prisma.resource.updateMany({
        where: { moduleId: body.moduleId },
        data: { moduleId: null },
      });
      if (body.resourceIds.length) {
        await prisma.resource.updateMany({
          where: { id: { in: body.resourceIds } },
          data: { moduleId: body.moduleId },
        });
      }
    }

    if (body.quizQuestions) {
      const quiz =
        updated.quiz ??
        (await prisma.quiz.create({
          data: { moduleId: body.moduleId },
        }));
      await prisma.quizQuestion.deleteMany({ where: { quizId: quiz.id } });
      if (body.quizQuestions.length) {
        await prisma.quizQuestion.createMany({
          data: body.quizQuestions.map((question) => ({
            quizId: quiz.id,
            question: question.question,
            options: question.options,
            correctIndex: question.correctIndex,
            explanation: question.explanation ?? null,
          })),
        });
      }
    }

    await logAdminAction({
      userId: admin.id,
      action: "COURSE_MODULE_UPDATED",
      entity: "CourseModule",
      entityId: body.moduleId,
    });

    return Response.json({ ok: true });
  } catch (error) {
    console.error(error);
    return apiError("Unable to update course module.", 500);
  }
}

export async function DELETE(request: Request) {
  try {
    const admin = await requireAdmin();
    const body = await safeJson<{ moduleId: string }>(request);
    await prisma.courseModule.delete({ where: { id: body.moduleId } });
    await logAdminAction({
      userId: admin.id,
      action: "COURSE_MODULE_DELETED",
      entity: "CourseModule",
      entityId: body.moduleId,
    });
    return Response.json({ ok: true });
  } catch (error) {
    console.error(error);
    return apiError("Unable to delete course module.", 500);
  }
}
