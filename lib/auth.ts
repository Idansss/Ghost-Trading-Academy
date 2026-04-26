import type { Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";
import authConfig from "@/auth.config";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { verifyShortLivedJwt } from "@/lib/jwt";
import { decryptSecret, matchBackupCode, verifyTOTPPlain } from "@/lib/two-factor";
import { AppError } from "@/server/core/app-error";

void env.nextAuthSecret;
void env.nextAuthUrl;

// CLAUDE FIX: email/password are optional so the 2FA loginToken path (which
// provides neither) passes schema validation. The authorize body enforces the
// correct fields for each path before using them.
const credentialsSchema = z.object({
  email: z.string().email().optional(),
  password: z.string().min(6).optional(),
  otpCode: z.string().optional(),
  loginToken: z.string().optional(),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  // Allow trusted localhost deployments (e.g. `npm run start` locally) while
  // keeping explicit env-based control for non-local environments.
  trustHost:
    process.env.AUTH_TRUST_HOST === "true" ||
    env.nextAuthUrl.includes("localhost") ||
    env.nextAuthUrl.includes("127.0.0.1"),
  session: {
    strategy: "jwt",
    // AUDIT FIX: Set a sensible session expiry. 7 days matches typical "remember me"
    // behaviour. Without this the default is 30 days which is too permissive.
    maxAge: 60 * 60 * 24 * 7,
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(rawCredentials) {
        const parsed = credentialsSchema.safeParse(rawCredentials);
        if (!parsed.success) {
          return null;
        }

        if (parsed.data.loginToken) {
          let tokenPayload: { type?: string; userId?: string };
          try {
            tokenPayload = await verifyShortLivedJwt<{ type?: string; userId?: string }>(
              parsed.data.loginToken,
            );
          } catch {
            return null;
          }
          if (tokenPayload.type !== "2fa-login" || !tokenPayload.userId) {
            return null;
          }
          const userFromToken = await prisma.user.findUnique({
            where: { id: tokenPayload.userId },
          });
          if (!userFromToken) return null;
          return {
            id: userFromToken.id,
            email: userFromToken.email,
            name: userFromToken.name,
            role: userFromToken.role,
            avatarUrl: userFromToken.avatarUrl,
            accountBalance: userFromToken.accountBalance,
            accountSize: userFromToken.accountSize,
            riskPerTrade: userFromToken.riskPerTrade,
          };
        }

        // CLAUDE FIX: Guard required — email/password are optional in the schema
        // so the loginToken path can pass validation. Reject here if absent.
        if (!parsed.data.email || !parsed.data.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email.toLowerCase() },
        });

        if (!user) {
          return null;
        }

        const isValidPassword = await bcrypt.compare(
          parsed.data.password,
          user.password,
        );
        if (!isValidPassword) {
          return null;
        }

        if (user.twoFactorEnabled) {
          if (!parsed.data.otpCode || !user.twoFactorSecret) {
            return null;
          }
          const secret = decryptSecret(user.twoFactorSecret);
          const isValidTotp = verifyTOTPPlain(parsed.data.otpCode, secret);
          if (!isValidTotp) {
            const backupCodes = await prisma.twoFactorBackupCode.findMany({
              where: { userId: user.id, usedAt: null },
            });
            let matchedBackupId: string | null = null;
            for (const backup of backupCodes) {
              if (await matchBackupCode(parsed.data.otpCode, backup.codeHash)) {
                matchedBackupId = backup.id;
                break;
              }
            }
            if (!matchedBackupId) return null;
            await prisma.twoFactorBackupCode.update({
              where: { id: matchedBackupId },
              data: { usedAt: new Date() },
            });
          }
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          avatarUrl: user.avatarUrl,
          accountBalance: user.accountBalance,
          accountSize: user.accountSize,
          riskPerTrade: user.riskPerTrade,
        };
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.role = user.role as Role;
        token.accountBalance = user.accountBalance;
        token.avatarUrl = user.avatarUrl;
        token.accountSize = user.accountSize;
        token.riskPerTrade = user.riskPerTrade;
      }

      if (trigger === "update" && session.user) {
        if (session.user.name !== undefined) {
          token.name = session.user.name;
        }
        if (session.user.avatarUrl !== undefined) {
          token.avatarUrl = session.user.avatarUrl;
        }
        if (session.user.accountSize !== undefined) {
          token.accountSize = session.user.accountSize;
        }
        if (session.user.riskPerTrade !== undefined) {
          token.riskPerTrade = session.user.riskPerTrade;
        }
      }

      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = String(token.id);
        session.user.role = token.role as Role;
        session.user.accountBalance = Number(token.accountBalance ?? 0);
        session.user.avatarUrl =
          token.avatarUrl === null ? null : String(token.avatarUrl ?? "");
        session.user.accountSize =
          token.accountSize === null || token.accountSize === undefined
            ? null
            : Number(token.accountSize);
        session.user.riskPerTrade = Number(token.riskPerTrade ?? 1);
      }
      return session;
    },
  },
});

/**
 * Verifies the current user is authenticated.
 */
export async function requireUser() {
  const session = await auth();
  if (!session?.user) {
    // AUDIT FIX: Replaced generic Error with AppError.unauthorized() so the
    // createRouteHandler error boundary correctly maps it to a 401 response
    // instead of falling through to the generic 500 INTERNAL_ERROR branch.
    throw AppError.unauthorized();
  }

  return session.user;
}

/**
 * Verifies the current user is an administrator.
 */
export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "ADMIN") {
    // AUDIT FIX: Replaced generic Error with AppError.forbidden() for the same
    // reason — the error handler can now return a proper 403 response.
    throw AppError.forbidden();
  }
  return user;
}
