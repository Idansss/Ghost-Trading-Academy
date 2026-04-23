import bcrypt from "bcryptjs";
import { addUserToDefaultChatChannels } from "@/lib/chat";
import { requireAdmin } from "@/lib/auth";
import { sendWelcomeEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";
import { apiError, safeJson } from "@/lib/utils";
import { memberCreateSchema, memberUpdateSchema } from "@/lib/validators";
import { logAdminAction } from "@/lib/audit-log";
import { createUniqueReferralCode } from "@/lib/referrals";

// AUDIT FIX: All authenticated API routes must opt out of static rendering
export const dynamic = "force-dynamic";

const memberSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  twoFactorEnabled: true,
  createdAt: true,
} as const;

export async function GET() {
  try {
    await requireAdmin();
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: memberSelect,
    });
    return Response.json({ users });
  } catch (error) {
    console.error(error);
    return apiError("Unable to load members.", 500);
  }
}

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin();
    const body = await safeJson<unknown>(request);
    const parsed = memberCreateSchema.safeParse(body);

    // AUDIT FIX: Validation error shape changed from { message, errors } to
    // { error, details } for consistency with the global error format.
    if (!parsed.success) {
      return Response.json(
        { error: "Validation failed.", details: parsed.error.flatten() },
        { status: 422 },
      );
    }

    const email = parsed.data.email.toLowerCase();
    const existingUser = await prisma.user.findUnique({ where: { email } });

    if (existingUser) {
      return apiError("A user with this email already exists.", 409);
    }

    const user = await prisma.user.create({
      data: {
        name: parsed.data.name,
        email,
        password: await bcrypt.hash(parsed.data.temporaryPassword, 12),
        role: parsed.data.role,
        referralCode: await createUniqueReferralCode(),
      },
      select: memberSelect,
    });

    // AUDIT FIX: Admin-created members now get the same default channel
    // memberships as self-registered users to prevent empty chat sidebars.
    await addUserToDefaultChatChannels(user.id, prisma);

    await sendWelcomeEmail(user.email, user.name);
    await logAdminAction({
      userId: admin.id,
      action: "MEMBER_CREATED",
      entity: "User",
      entityId: user.id,
      metadata: { role: user.role, email: user.email },
    });

    return Response.json(user);
  } catch (error) {
    console.error(error);
    return apiError("Unable to create member.", 500);
  }
}

export async function PATCH(request: Request) {
  try {
    const admin = await requireAdmin();
    const body = await safeJson<unknown>(request);
    const parsed = memberUpdateSchema.safeParse(body);
    // AUDIT FIX: Validation error shape changed from { message, errors } to
    // { error, details } for consistency with the global error format.
    if (!parsed.success) {
      return Response.json(
        { error: "Validation failed.", details: parsed.error.flatten() },
        { status: 422 },
      );
    }

    const user = await prisma.user.update({
      where: { id: parsed.data.userId },
      data: {
        role: parsed.data.role,
      },
      select: memberSelect,
    });
    await logAdminAction({
      userId: admin.id,
      action: "MEMBER_UPDATED",
      entity: "User",
      entityId: user.id,
      metadata: { role: user.role },
    });

    return Response.json(user);
  } catch (error) {
    console.error(error);
    return apiError("Unable to update member.", 500);
  }
}
