import { prisma } from "@/lib/prisma";
import { apiError, safeJson } from "@/lib/utils";
import { signShortLivedJwt, verifyShortLivedJwt } from "@/lib/jwt";
import { decryptSecret, matchBackupCode, verifyTOTPPlain } from "@/lib/two-factor";
import { checkRateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/server/core/request-context";

// AUDIT FIX: All authenticated API routes must opt out of static rendering
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const identifier = getClientIp(request) ?? "unknown";
    const rate = await checkRateLimit("2fa", identifier);
    if (!rate.success) {
      return Response.json(
        { error: "Too many 2FA attempts. Please try again later." },
        { status: 429, headers: { "Retry-After": String(Math.max(1, Math.ceil((rate.reset - Date.now()) / 1000))) } },
      );
    }

    const body = await safeJson<{ token?: string; code?: string }>(request);
    if (!body.token || !body.code) {
      return apiError("Token and code are required.", 400);
    }
    const payload = await verifyShortLivedJwt<{ type?: string; userId?: string }>(body.token);
    if (payload.type !== "2fa-pending" || !payload.userId) {
      return apiError("Invalid token.", 400);
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: { backupCodes: true },
    });
    if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
      return apiError("2FA not enabled for this account.", 400);
    }

    const secret = decryptSecret(user.twoFactorSecret);
    let valid = verifyTOTPPlain(body.code, secret);
    if (!valid) {
      for (const backup of user.backupCodes.filter((entry) => !entry.usedAt)) {
        if (await matchBackupCode(body.code, backup.codeHash)) {
          valid = true;
          await prisma.twoFactorBackupCode.update({
            where: { id: backup.id },
            data: { usedAt: new Date() },
          });
          break;
        }
      }
    }
    if (!valid) {
      return apiError("Invalid authentication code.", 401);
    }

    const loginToken = await signShortLivedJwt(
      { type: "2fa-login", userId: user.id },
      "5m",
    );
    return Response.json({ loginToken });
  } catch (error) {
    console.error(error);
    return apiError("Unable to verify 2FA code.", 500);
  }
}
