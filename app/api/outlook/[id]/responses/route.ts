import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { assertTrustedImageUrl } from "@/lib/sanitize";
import { apiError, safeJson } from "@/lib/utils";
import { outlookMemberResponseSchema } from "@/lib/validators";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireUser();
    const { id } = await params;

    const responses = await prisma.outlookMemberResponse.findMany({
      where: { outlookId: id },
      include: {
        member: { select: { id: true, name: true, avatarUrl: true } },
      },
      orderBy: { createdAt: "asc" },
    });

    return Response.json({ responses });
  } catch (error) {
    console.error(error);
    return apiError("Unable to load responses.", 500);
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireUser();
    const { id } = await params;

    const outlook = await prisma.dailyOutlook.findUnique({ where: { id } });
    if (!outlook) return apiError("Outlook not found.", 404);

    const body = await safeJson<unknown>(request);
    const parsed = outlookMemberResponseSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { error: "Validation failed.", details: parsed.error.flatten() },
        { status: 422 },
      );
    }

    assertTrustedImageUrl(parsed.data.chartImageUrl ?? null);

    const response = await prisma.outlookMemberResponse.upsert({
      where: { outlookId_userId: { outlookId: id, userId: user.id } },
      update: {
        memberBias: parsed.data.memberBias,
        note: parsed.data.note ?? null,
        chartImageUrl: parsed.data.chartImageUrl || null,
      },
      create: {
        outlookId: id,
        userId: user.id,
        memberBias: parsed.data.memberBias,
        note: parsed.data.note ?? null,
        chartImageUrl: parsed.data.chartImageUrl || null,
      },
      include: {
        member: { select: { id: true, name: true, avatarUrl: true } },
      },
    });

    return Response.json(response);
  } catch (error) {
    console.error(error);
    return apiError("Unable to save response.", 500);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireUser();
    const { id } = await params;

    await prisma.outlookMemberResponse.deleteMany({
      where: { outlookId: id, userId: user.id },
    });

    return new Response(null, { status: 204 });
  } catch (error) {
    console.error(error);
    return apiError("Unable to delete response.", 500);
  }
}
