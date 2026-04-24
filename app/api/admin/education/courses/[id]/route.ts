import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiError, safeJson } from "@/lib/utils";
import { logAdminAction } from "@/lib/audit-log";

// AUDIT FIX: All authenticated API routes must opt out of static rendering
export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const admin = await requireAdmin();
    const body = await safeJson<{
      title?: string;
      description?: string;
      coverImage?: string | null;
      handoutPdfUrl?: string | null;
      isPublished?: boolean;
      order?: number;
    }>(request);
    const updated = await prisma.course.update({
      where: { id: params.id },
      data: {
        ...(body.title !== undefined ? { title: body.title } : {}),
        ...(body.description !== undefined ? { description: body.description } : {}),
        ...(body.coverImage !== undefined ? { coverImage: body.coverImage } : {}),
        ...(body.handoutPdfUrl !== undefined ? { handoutPdfUrl: body.handoutPdfUrl } : {}),
        ...(body.isPublished !== undefined ? { isPublished: body.isPublished } : {}),
        ...(body.order !== undefined ? { order: body.order } : {}),
      },
    });
    await logAdminAction({
      userId: admin.id,
      action: "COURSE_UPDATED",
      entity: "Course",
      entityId: params.id,
    });
    return Response.json(updated);
  } catch (error) {
    console.error(error);
    return apiError("Unable to update course.", 500);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const admin = await requireAdmin();
    await prisma.course.delete({ where: { id: params.id } });
    await logAdminAction({
      userId: admin.id,
      action: "COURSE_DELETED",
      entity: "Course",
      entityId: params.id,
    });
    return Response.json({ ok: true });
  } catch (error) {
    console.error(error);
    return apiError("Unable to delete course.", 500);
  }
}
