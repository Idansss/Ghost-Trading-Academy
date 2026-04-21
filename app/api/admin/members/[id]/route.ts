import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiError } from "@/lib/utils";

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } },
) {
  try {
    await requireAdmin();
    await prisma.user.delete({
      where: { id: params.id },
    });
    return Response.json({ ok: true });
  } catch {
    return apiError("Unable to delete member.", 500);
  }
}
