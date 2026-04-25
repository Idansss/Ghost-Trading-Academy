import { requireUser } from "@/lib/auth";
import { signShortLivedJwt, verifyShortLivedJwt } from "@/lib/jwt";
import { prisma } from "@/lib/prisma";
import { apiError, handleApiError, safeJson } from "@/lib/utils";
import { checkRateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/server/core/request-context";
import {
  encryptSecret,
  generateBackupCodes,
  generateTOTPSecret,
  hashBackupCode,
  toQrDataUrl,
  verifyTOTPPlain,
} from "@/lib/two-factor";

// AUDIT FIX: All authenticated API routes must opt out of static rendering.
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const identifier = getClientIp(request) ?? "unknown";
    const rate = await checkRateLimit("2fa", identifier);
    if (!rate.success) {
      return Response.json(
        { error: "Too many 2FA setup attempts. Please try again later." },
        { status: 429, headers: { "Retry-After": String(Math.max(1, Math.ceil((rate.reset - Date.now()) / 1000))) } },
      );
    }

    const user = await requireUser();
    const body = await safeJson<{ action?: "start" | "verify"; token?: string; code?: string }>(
      request,
    );

    if (body.action === "start") {
      const { secret, otpAuthUrl } = generateTOTPSecret(user.email ?? "member@ghost.local");
      const qrCodeDataUrl = await toQrDataUrl(otpAuthUrl);
      const backupCodes = generateBackupCodes(10);
      const backupCodeHashes = await Promise.all(backupCodes.map((code) => hashBackupCode(code)));

      // CLAUDE FIX: Previously stored raw backup codes in the JWT payload alongside
      // the hashes. Raw codes are already returned in the response body for the user
      // to save — they do not need to be in the token too (less sensitive data in JWT).
      const token = await signShortLivedJwt(
        {
          type: "2fa-setup",
          userId: user.id,
          secret,
          backupCodeHashes,
        },
        "15m",
      );

      return Response.json({ token, qrCodeDataUrl, backupCodes });
    }

    if (body.action === "verify" && body.token && body.code) {
      const payload = await verifyShortLivedJwt<{
        type?: string;
        userId?: string;
        secret?: string;
        backupCodeHashes?: string[];
      }>(body.token);

      if (payload.type !== "2fa-setup" || payload.userId !== user.id || !payload.secret) {
        return apiError("Invalid setup token.", 400);
      }

      if (!verifyTOTPPlain(body.code, payload.secret)) {
        return apiError("Invalid 2FA code.", 400);
      }

      await prisma.$transaction(async (tx) => {
        await tx.user.update({
          where: { id: user.id },
          data: {
            twoFactorEnabled: true,
            twoFactorSecret: encryptSecret(payload.secret!),
          },
        });
        await tx.twoFactorBackupCode.deleteMany({ where: { userId: user.id } });
        if (payload.backupCodeHashes?.length) {
          await tx.twoFactorBackupCode.createMany({
            data: payload.backupCodeHashes.map((codeHash) => ({
              userId: user.id,
              codeHash,
            })),
          });
        }
      });

      return Response.json({ ok: true });
    }

    return apiError("Invalid request.", 400);
  } catch (error) {
    // CLAUDE FIX: Replaced bare console.error(error) with handleApiError which
    // maps AppError instances to correct HTTP codes and avoids leaking the full
    // stack trace in error responses.
    return handleApiError(error, "Unable to setup 2FA.");
  }
}
