import bcrypt from "bcryptjs";
import { calculateMonthlyPnL, getMonthlySnapshot } from "@/lib/calculations";
import { markOnboardingStepComplete } from "@/lib/onboarding";
import { prisma } from "@/lib/prisma";
import { assertTrustedImageUrl } from "@/lib/sanitize";
import { profileSchema } from "@/lib/validators";
import { requireAuthenticatedUser } from "@/server/core/auth";
import { AppError } from "@/server/core/app-error";
import { success } from "@/server/core/http";
import { createRouteHandler } from "@/server/core/route";
import { parseJsonBody } from "@/server/core/validation";

export const dynamic = "force-dynamic";

export const GET = createRouteHandler(async () => {
  const user = await requireAuthenticatedUser();

  const trades = await prisma.trade.findMany({
    where: { userId: user.id },
    orderBy: { tradeDate: "asc" },
  });

  const snapshot = getMonthlySnapshot(trades);
  const bestMonth =
    Object.entries(snapshot).sort((left, right) => right[1] - left[1])[0] ?? null;

  const profile = await prisma.user.findUnique({
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
  });

  return success({
    profile,
    stats: {
      totalTrades: trades.length,
      totalPnl: calculateMonthlyPnL(trades),
      bestMonth,
    },
  });
});

export const PATCH = createRouteHandler(async ({ request }) => {
  const user = await requireAuthenticatedUser();
  const data = await parseJsonBody(request, profileSchema);

  const existingUser = await prisma.user.findUnique({ where: { id: user.id } });
  if (!existingUser) {
    throw AppError.notFound("User not found.");
  }

  assertTrustedImageUrl(data.avatarUrl || null);

  if (data.currentPassword && data.newPassword) {
    const valid = await bcrypt.compare(data.currentPassword, existingUser.password);
    if (!valid) {
      throw AppError.badRequest("Current password is incorrect.");
    }
  }

  // CLAUDE FIX: riskPerTrade is now optional in the schema (onboarding mode omits it).
  // Only write it when the client sends a value so we never clobber an existing setting.
  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      name: data.name,
      avatarUrl: data.avatarUrl || null,
      accountSize: data.accountSize ?? null,
      ...(data.riskPerTrade !== undefined && { riskPerTrade: data.riskPerTrade }),
      leaderboardOptIn: data.leaderboardOptIn,
      emailSignalAlerts: data.emailSignalAlerts,
      ...(data.newPassword ? { password: await bcrypt.hash(data.newPassword, 12) } : {}),
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

  return success(updated);
});
