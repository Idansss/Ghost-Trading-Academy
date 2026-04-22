import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiError } from "@/lib/utils";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireUser();
    const { id: signalId } = await params;

    const existing = await prisma.signalTaken.findUnique({
      where: { userId_signalId: { userId: user.id, signalId } },
    });

    if (existing) {
      await prisma.signalTaken.delete({
        where: { userId_signalId: { userId: user.id, signalId } },
      });
      return Response.json({ taken: false });
    }

    await prisma.signalTaken.create({
      data: { userId: user.id, signalId },
    });

    return Response.json({ taken: true });
  } catch {
    return apiError("Unable to update signal taken status.", 500);
  }
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireUser();
    const { id: signalId } = await params;

    const existing = await prisma.signalTaken.findUnique({
      where: { userId_signalId: { userId: user.id, signalId } },
    });

    return Response.json({ taken: Boolean(existing) });
  } catch {
    return apiError("Unable to check signal taken status.", 500);
  }
}
