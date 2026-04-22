import bcrypt from "bcryptjs";
import { SubscriptionStatus } from "@prisma/client";
import { z } from "zod";
import { sendWelcomeEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";
import { apiError, safeJson } from "@/lib/utils";

const registerSchema = z
  .object({
    name: z.string().min(2, "Full name is required."),
    email: z.string().email("Enter a valid email."),
    password: z.string().min(8, "Password must be at least 8 characters."),
    confirmPassword: z.string().min(8),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export async function POST(request: Request) {
  try {
    const body = await safeJson<z.infer<typeof registerSchema>>(request);
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        {
          message: "Validation failed.",
          errors: parsed.error.flatten().fieldErrors,
        },
        { status: 422 },
      );
    }

    const email = parsed.data.email.toLowerCase();
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return apiError("An account with this email already exists.", 409);
    }

    const password = await bcrypt.hash(parsed.data.password, 12);
    const user = await prisma.user.create({
      data: {
        name: parsed.data.name,
        email,
        password,
        subscriptionStatus: SubscriptionStatus.TRIAL,
      },
    });

    await sendWelcomeEmail(user.email, user.name);

    return Response.json({
      ok: true,
      user: {
        id: user.id,
        email: user.email,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (
      message.includes("Can't reach database server") ||
      message.includes("ECONNREFUSED") ||
      message.includes("P1001")
    ) {
      return apiError(
        "Database connection failed. Check DATABASE_URL and try again.",
        500,
      );
    }
    return apiError("Registration failed. Please try again later.", 500);
  }
}
