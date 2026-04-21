import bcrypt from "bcryptjs";
import { calculateMonthlyPnL, getMonthlySnapshot } from "@/lib/calculations";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiError, safeJson } from "@/lib/utils";
import { profileSchema } from "@/lib/validators";

export async function GET() {
  try {
    const user = await requireUser();
    const trades = await prisma.trade.findMany({
      where: { userId: user.id },
      orderBy: { tradeDate: "asc" },
    });

    const snapshot = getMonthlySnapshot(trades);
    const bestMonth =
      Object.entries(snapshot).sort((left, right) => right[1] - left[1])[0] ?? null;

    return Response.json({
      profile: await prisma.user.findUnique({
        where: { id: user.id },
        select: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true,
          role: true,
          subscriptionStatus: true,
          subscriptionExpiry: true,
          createdAt: true,
        },
      }),
      stats: {
        totalTrades: trades.length,
        totalPnl: calculateMonthlyPnL(trades),
        bestMonth,
      },
    });
  } catch {
    return apiError("Unable to load profile.", 500);
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await requireUser();
    const body = await safeJson<unknown>(request);
    const parsed = profileSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { message: "Invalid profile update.", errors: parsed.error.flatten().fieldErrors },
        { status: 422 },
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { id: user.id },
    });

    if (!existingUser) {
      return apiError("User not found.", 404);
    }

    if (parsed.data.currentPassword && parsed.data.newPassword) {
      const valid = await bcrypt.compare(
        parsed.data.currentPassword,
        existingUser.password,
      );

      if (!valid) {
        return apiError("Current password is incorrect.", 400);
      }
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        name: parsed.data.name,
        avatarUrl: parsed.data.avatarUrl || null,
        ...(parsed.data.newPassword
          ? { password: await bcrypt.hash(parsed.data.newPassword, 12) }
          : {}),
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
        role: true,
        subscriptionStatus: true,
        subscriptionExpiry: true,
      },
    });

    return Response.json(updated);
  } catch {
    return apiError("Unable to update profile.", 500);
  }
}
