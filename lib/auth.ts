import { PrismaAdapter } from "@auth/prisma-adapter";
import type { Role, SubscriptionStatus } from "@prisma/client";
import bcrypt from "bcryptjs";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";
import authConfig from "@/auth.config";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";

void env.nextAuthSecret;
void env.nextAuthUrl;

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
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

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          avatarUrl: user.avatarUrl,
          accountBalance: user.accountBalance,
          subscriptionStatus: user.subscriptionStatus,
          subscriptionExpiry: user.subscriptionExpiry,
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
        token.subscriptionStatus = user.subscriptionStatus;
        token.subscriptionExpiry = user.subscriptionExpiry
          ? new Date(user.subscriptionExpiry).toISOString()
          : null;
        token.accountBalance = user.accountBalance;
        token.avatarUrl = user.avatarUrl;
      }

      if (trigger === "update" && session.user) {
        token.name = session.user.name;
      }

      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = String(token.id);
        session.user.role = token.role as Role;
        session.user.subscriptionStatus =
          token.subscriptionStatus as SubscriptionStatus;
        session.user.subscriptionExpiry =
          token.subscriptionExpiry === null
            ? null
            : new Date(String(token.subscriptionExpiry));
        session.user.accountBalance = Number(token.accountBalance ?? 0);
        session.user.avatarUrl =
          token.avatarUrl === null ? null : String(token.avatarUrl ?? "");
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
    throw new Error("Unauthorized");
  }

  return session.user;
}

/**
 * Verifies the current user is an administrator.
 */
export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "ADMIN") {
    throw new Error("Forbidden");
  }
  return user;
}
