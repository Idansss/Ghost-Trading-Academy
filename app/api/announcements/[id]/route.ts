import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiError } from "@/lib/utils";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin();
    const { id } = await params;
    await prisma.announcement.delete({ where: { id } });
    return Response.json({ success: true });
  } catch {
    return apiError("Unable to delete announcement.", 500);
  }
}
