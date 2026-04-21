import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiError } from "@/lib/utils";

export async function POST(
  _request: Request,
  { params }: { params: { id: string } },
) {
  try {
    await requireUser();
    const win = await prisma.memberWin.update({
      where: { id: params.id },
      data: {
        likesCount: {
          increment: 1,
        },
      },
    });
    return Response.json(win);
  } catch {
    return apiError("Unable to like member win.", 500);
  }
}
