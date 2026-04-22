import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiError, safeJson } from "@/lib/utils";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await safeJson<{ isApproved?: boolean }>(request);
    const win = await prisma.memberWin.update({
      where: { id },
      data: { isApproved: body.isApproved ?? true },
    });
    return Response.json(win);
  } catch {
    return apiError("Unable to update member win.", 500);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin();
    const { id } = await params;
    await prisma.memberWin.delete({ where: { id } });
    return Response.json({ success: true });
  } catch {
    return apiError("Unable to delete member win.", 500);
  }
}
