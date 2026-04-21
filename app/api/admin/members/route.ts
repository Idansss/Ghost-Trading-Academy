import bcrypt from "bcryptjs";
import { SubscriptionStatus } from "@prisma/client";
import { requireAdmin } from "@/lib/auth";
import { sendWelcomeEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";
import { apiError, safeJson } from "@/lib/utils";
import { memberCreateSchema, memberUpdateSchema } from "@/lib/validators";

const memberSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  subscriptionStatus: true,
  subscriptionExpiry: true,
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
  } catch {
    return apiError("Unable to load members.", 500);
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const body = await safeJson<unknown>(request);
    const parsed = memberCreateSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { message: "Invalid member payload.", errors: parsed.error.flatten().fieldErrors },
        { status: 422 },
      );
    }

    const email = parsed.data.email.toLowerCase();
    const existingUser = await prisma.user.findUnique({ where: { email } });

    if (existingUser) {
      return apiError("A user with this email already exists.", 409);
    }

    const expiryDate = parsed.data.subscriptionExpiry
      ? new Date(parsed.data.subscriptionExpiry)
      : null;

    const user = await prisma.user.create({
      data: {
        name: parsed.data.name,
        email,
        password: await bcrypt.hash(parsed.data.temporaryPassword, 12),
        role: parsed.data.role,
        subscriptionExpiry: expiryDate,
        subscriptionStatus:
          parsed.data.role === "MEMBER"
            ? SubscriptionStatus.TRIAL
            : expiryDate && expiryDate < new Date()
              ? SubscriptionStatus.EXPIRED
              : SubscriptionStatus.ACTIVE,
      },
      select: memberSelect,
    });

    await sendWelcomeEmail(user.email, user.name);

    return Response.json(user);
  } catch {
    return apiError("Unable to create member.", 500);
  }
}

export async function PATCH(request: Request) {
  try {
    await requireAdmin();
    const body = await safeJson<unknown>(request);
    const parsed = memberUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { message: "Invalid member update.", errors: parsed.error.flatten().fieldErrors },
        { status: 422 },
      );
    }

    const user = await prisma.user.update({
      where: { id: parsed.data.userId },
      data: {
        role: parsed.data.role,
        subscriptionStatus: parsed.data.subscriptionStatus,
        subscriptionExpiry: parsed.data.subscriptionExpiry
          ? new Date(parsed.data.subscriptionExpiry)
          : null,
      },
      select: memberSelect,
    });

    return Response.json(user);
  } catch {
    return apiError("Unable to update member.", 500);
  }
}
