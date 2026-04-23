import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { apiError, safeJson } from "@/lib/utils";
import { signShortLivedJwt } from "@/lib/jwt";
import { checkRateLimit } from "@/lib/rate-limit";

// AUDIT FIX: All authenticated API routes must opt out of static rendering
export const dynamic = "force-dynamic";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export async function POST(request: Request) {
  try {
    const identifier = request.headers.get("x-forwarded-for") ?? "unknown-ip";
    const rate = await checkRateLimit("login", identifier);
    if (!rate.success) {
      // AUDIT FIX: Use { error } shape to match all other API error responses.
      return Response.json(
        { error: "Too many login attempts. Please try again later." },
        { status: 429, headers: { "Retry-After": String(Math.max(1, Math.ceil((rate.reset - Date.now()) / 1000))) } },
      );
    }
    const body = await safeJson<unknown>(request);
    const parsed = schema.safeParse(body);
    if (!parsed.success) return apiError("Invalid credentials.", 400);

    const user = await prisma.user.findUnique({
      where: { email: parsed.data.email.toLowerCase() },
    });
    if (!user) return apiError("Invalid credentials.", 401);
    const valid = await bcrypt.compare(parsed.data.password, user.password);
    if (!valid) return apiError("Invalid credentials.", 401);

    if (!user.twoFactorEnabled) {
      return Response.json({ requiresTwoFactor: false });
    }

    const token = await signShortLivedJwt(
      {
        type: "2fa-pending",
        userId: user.id,
        email: user.email,
      },
      "5m",
    );
    return Response.json({ requiresTwoFactor: true, token });
  } catch (error) {
    console.error(error);
    return apiError("Unable to process 2FA challenge.", 500);
  }
}
