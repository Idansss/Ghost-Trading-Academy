import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiError, safeJson } from "@/lib/utils";
import { resourceSchema } from "@/lib/validators";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    await requireAdmin();
    const body = await safeJson<Record<string, unknown>>(request);
    const existingResource = await prisma.resource.findUnique({
      where: { id: params.id },
    });

    if (!existingResource) {
      return apiError("Resource not found.", 404);
    }

    const parsed = resourceSchema.safeParse({
      title: body.title ?? existingResource.title,
      description: body.description ?? existingResource.description,
      type: body.type ?? existingResource.type,
      url: body.url ?? existingResource.url,
      fileKey: body.fileKey ?? existingResource.fileKey,
      tag: body.tag ?? existingResource.tag,
      isVipOnly: body.isVipOnly ?? existingResource.isVipOnly,
      meta: body.meta ?? existingResource.meta,
    });

    if (!parsed.success) {
      return Response.json(
        { message: "Invalid resource payload.", errors: parsed.error.flatten().fieldErrors },
        { status: 422 },
      );
    }

    const resource = await prisma.resource.update({
      where: { id: params.id },
      data: {
        ...parsed.data,
        fileKey: parsed.data.fileKey ?? null,
      },
    });
    return Response.json(resource);
  } catch {
    return apiError("Unable to update resource.", 500);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } },
) {
  try {
    await requireAdmin();
    await prisma.resource.delete({ where: { id: params.id } });
    return Response.json({ ok: true });
  } catch {
    return apiError("Unable to delete resource.", 500);
  }
}
