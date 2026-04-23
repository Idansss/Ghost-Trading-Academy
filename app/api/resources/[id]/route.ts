import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiError, safeJson } from "@/lib/utils";
import { resourceSchema } from "@/lib/validators";
import { sanitizeHtml } from "@/lib/sanitize";

// AUDIT FIX: All authenticated API routes must opt out of static rendering
export const dynamic = "force-dynamic";

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

    // AUDIT FIX: Validation error shape changed from { message, errors } to
    // { error, details } for consistency with the global error format.
    if (!parsed.success) {
      return Response.json(
        { error: "Validation failed.", details: parsed.error.flatten() },
        { status: 422 },
      );
    }

    const resource = await prisma.resource.update({
      where: { id: params.id },
      data: {
        ...parsed.data,
        description: sanitizeHtml(parsed.data.description),
        fileKey: parsed.data.fileKey ?? null,
      },
    });
    return Response.json(resource);
  } catch (error) {
    console.error(error);
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
  } catch (error) {
    console.error(error);
    return apiError("Unable to delete resource.", 500);
  }
}
