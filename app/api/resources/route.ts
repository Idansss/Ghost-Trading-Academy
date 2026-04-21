import { requireAdmin, requireUser } from "@/lib/auth";
import { createNotification } from "@/lib/actions/notifications";
import { prisma } from "@/lib/prisma";
import { apiError, safeJson } from "@/lib/utils";
import { resourceSchema } from "@/lib/validators";

export async function GET() {
  try {
    const user = await requireUser();
    const resources = await prisma.resource.findMany({
      where: user.role === "MEMBER" ? { isVipOnly: false } : undefined,
      orderBy: { uploadedAt: "desc" },
    });
    return Response.json({ resources });
  } catch {
    return apiError("Unable to load resources.", 500);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAdmin();
    const body = await safeJson<unknown>(request);
    const parsed = resourceSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { message: "Invalid resource payload.", errors: parsed.error.flatten().fieldErrors },
        { status: 422 },
      );
    }

    const resource = await prisma.resource.create({
      data: {
        ...parsed.data,
        fileKey: parsed.data.fileKey ?? null,
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
  } catch {
    return apiError("Unable to save resource.", 500);
  }
}
