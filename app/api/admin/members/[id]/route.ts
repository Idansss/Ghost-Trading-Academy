import { requireAdmin } from "@/lib/auth";
import { logAdminAction } from "@/lib/audit-log";
import { prisma } from "@/lib/prisma";
import { apiError } from "@/lib/utils";

// AUDIT FIX: All authenticated API routes must opt out of static rendering
export const dynamic = "force-dynamic";

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const admin = await requireAdmin();
    await prisma.user.delete({
      where: { id: params.id },
    });
    await logAdminAction({
      userId: admin.id,
      action: "MEMBER_DELETED",
      entity: "User",
      entityId: params.id,
    });
    return Response.json({ ok: true });
  } catch (error) {
    console.error(error);
    return apiError("Unable to delete member.", 500);
  }
}
