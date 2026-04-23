import bcrypt from "bcryptjs";
import { calculateMonthlyPnL, getMonthlySnapshot } from "@/lib/calculations";
import { requireUser } from "@/lib/auth";
import { markOnboardingStepComplete } from "@/lib/onboarding";
import { prisma } from "@/lib/prisma";
import { assertTrustedImageUrl } from "@/lib/sanitize";
import { apiError, safeJson } from "@/lib/utils";
import { profileSchema } from "@/lib/validators";

// AUDIT FIX: All authenticated API routes must opt out of static rendering
export const dynamic = "force-dynamic";

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
          accountSize: true,
          riskPerTrade: true,
          leaderboardOptIn: true,
          emailSignalAlerts: true,
          twoFactorEnabled: true,
          referralCode: true,
          createdAt: true,
        },
      }),
      stats: {
        totalTrades: trades.length,
        totalPnl: calculateMonthlyPnL(trades),
        bestMonth,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return apiError("Unauthorized.", 401);
    }
    return apiError("Unable to load profile.", 500);
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await requireUser();
    const body = await safeJson<unknown>(request);
    const parsed = profileSchema.safeParse(body);
    // AUDIT FIX: Validation error shape changed from { message, errors } to
    // { error, details } for consistency with the global error format.
    if (!parsed.success) {
      return Response.json(
        { error: "Validation failed.", details: parsed.error.flatten() },
        { status: 422 },
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { id: user.id },
    });

    if (!existingUser) {
      return apiError("User not found.", 404);
    }
    assertTrustedImageUrl(parsed.data.avatarUrl || null);

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
        accountSize: parsed.data.accountSize ?? null,
        riskPerTrade: parsed.data.riskPerTrade,
        leaderboardOptIn: parsed.data.leaderboardOptIn,
        emailSignalAlerts: parsed.data.emailSignalAlerts,
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
        accountSize: true,
        riskPerTrade: true,
        leaderboardOptIn: true,
        emailSignalAlerts: true,
        twoFactorEnabled: true,
        referralCode: true,
      },
    });

    await markOnboardingStepComplete(user.id, "PROFILE_SETUP");

    return Response.json(updated);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return apiError("Unauthorized.", 401);
    }
    return apiError("Unable to update profile.", 500);
  }
}
