import { requireAdmin, requireUser } from "@/lib/auth";
import { createNotification } from "@/lib/actions/notifications";
import { prisma } from "@/lib/prisma";
import { sanitizeHtml } from "@/lib/sanitize";
import { apiError, safeJson } from "@/lib/utils";
import { resourceSchema } from "@/lib/validators";

// AUDIT FIX: All authenticated API routes must opt out of static rendering
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await requireUser();
    const [resources, completions] = await Promise.all([
      prisma.resource.findMany({ orderBy: { uploadedAt: "desc" } }),
      prisma.resourceCompletion.findMany({
        where: { userId: user.id },
        select: { resourceId: true },
      }),
    ]);

    const completedSet = new Set(completions.map((c) => c.resourceId));
    const resourcesWithCompletion = resources.map((r) => ({
      ...r,
      completedByMe: completedSet.has(r.id),
    }));

    return Response.json({
      resources: resourcesWithCompletion,
      completedCount: completedSet.size,
      totalCount: resources.length,
    });
  } catch (error) {
    console.error("[resources GET]", error);
    return apiError("Unable to load resources.", 500);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAdmin();
    const body = await safeJson<Record<string, unknown>>(request);
    const parsed = resourceSchema.safeParse(body);

    // AUDIT FIX: Validation error shape changed from { message, errors } to
    // { error, details } to match the spec and the apiError() convention.
    if (!parsed.success) {
      return Response.json(
        { error: "Validation failed.", details: parsed.error.flatten() },
        { status: 422 },
      );
    }

    const moduleId =
      typeof body.moduleId === "string" && body.moduleId.trim().length > 0
        ? body.moduleId
        : null;

    if (moduleId) {
      const courseModule = await prisma.courseModule.findUnique({
        where: { id: moduleId },
        select: { id: true },
      });

      if (!courseModule) {
        return apiError("Course module not found.", 404);
      }
    }

    const resource = await prisma.resource.create({
      data: {
        ...parsed.data,
        description: sanitizeHtml(parsed.data.description),
        fileKey: parsed.data.fileKey ?? null,
        moduleId,
        uploadedBy: user.id,
      },
    });

    const recipients = await prisma.user.findMany({
      where: {
        role: "VIP",
      },
      select: { id: true },
    });

    await prisma.announcement.create({
      data: {
        title: `New ${resource.type.toLowerCase()} resource`,
        message: resource.title,
        type: "NEW_RESOURCE",
        postedBy: user.id,
      },
    });

    await Promise.all(
      recipients.map((recipient) =>
        createNotification(
          recipient.id,
          "NEW_RESOURCE",
          `New resource: ${resource.title}`,
          `${resource.type}: ${resource.description}`,
          "/education",
        ),
      ),
    );

    return Response.json(resource);
  } catch (error) {
    console.error("[resources POST]", error);
    return apiError("Unable to save resource.", 500);
  }
}
