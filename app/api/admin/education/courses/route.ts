import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiError, safeJson } from "@/lib/utils";
import { logAdminAction } from "@/lib/audit-log";

// AUDIT FIX: All authenticated API routes must opt out of static rendering
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireAdmin();
    const [courses, resources] = await Promise.all([
      prisma.course.findMany({
        orderBy: { order: "asc" },
        include: {
          modules: {
            orderBy: { order: "asc" },
            include: {
              resources: true,
              quiz: {
                include: { questions: true },
              },
            },
          },
        },
      }),
      prisma.resource.findMany({
        orderBy: { uploadedAt: "desc" },
      }),
    ]);
    return Response.json({ courses, resources });
  } catch (error) {
    console.error(error);
    return apiError("Unable to load admin education data.", 500);
  }
}

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin();
    const body = await safeJson<{
      title: string;
      description: string;
      coverImage?: string | null;
      isPublished?: boolean;
    }>(request);
    const maxOrder = await prisma.course.aggregate({ _max: { order: true } });
    const course = await prisma.course.create({
      data: {
        title: body.title,
        description: body.description,
        coverImage: body.coverImage ?? null,
        isPublished: body.isPublished ?? false,
        order: (maxOrder._max.order ?? 0) + 1,
      },
    });
    await logAdminAction({
      userId: admin.id,
      action: "COURSE_CREATED",
      entity: "Course",
      entityId: course.id,
    });
    return Response.json(course);
  } catch (error) {
    console.error(error);
    return apiError("Unable to create course.", 500);
  }
}
