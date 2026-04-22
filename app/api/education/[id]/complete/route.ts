import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiError } from "@/lib/utils";

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
      return Response.json({ completed: false });
    }

    await prisma.resourceCompletion.create({
      data: { userId: user.id, resourceId },
    });

    return Response.json({ completed: true });
  } catch {
    return apiError("Unable to update completion status.", 500);
  }
}
