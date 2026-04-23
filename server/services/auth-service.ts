import bcrypt from "bcryptjs";
import { sendWelcomeEmail } from "@/lib/email";
import { createUniqueReferralCode } from "@/lib/referrals";
import { AppError } from "@/server/core/app-error";
import logger from "@/server/core/logger";
import { type UserRepository, userRepository } from "@/server/repositories/user-repository";

type AuthServiceDependencies = {
  createReferralCode: typeof createUniqueReferralCode;
  hashPassword: (password: string) => Promise<string>;
  sendWelcomeEmail: typeof sendWelcomeEmail;
  users: Pick<
    UserRepository,
    "createRegisteredUser" | "findByEmail" | "findReferrerByCode"
  >;
};

export class AuthService {
  constructor(private readonly deps: AuthServiceDependencies) {}

  async register(input: {
    name: string;
    email: string;
    password: string;
    referralCode?: string;
  }) {
    const email = input.email.toLowerCase();
    const existingUser = await this.deps.users.findByEmail(email);

    if (existingUser) {
      throw AppError.conflict(
        "An account with this email already exists.",
        "ACCOUNT_ALREADY_EXISTS",
      );
    }

    const [passwordHash, ownReferralCode] = await Promise.all([
      this.deps.hashPassword(input.password),
      this.deps.createReferralCode(),
    ]);

    const referrer = input.referralCode
      ? await this.deps.users.findReferrerByCode(input.referralCode)
      : null;

    const user = await this.deps.users.createRegisteredUser({
      name: input.name.trim(),
      email,
      passwordHash,
      referralCode: ownReferralCode,
      referrerId: referrer?.id ?? null,
    });

    void this.deps.sendWelcomeEmail(user.email, user.name).catch((error) => {
      logger.warn({
        type: "welcome_email_failed",
        userId: user.id,
        errorMessage: error instanceof Error ? error.message : "Unknown error",
      });
    });

    return {
      ok: true,
      user: {
        id: user.id,
        email: user.email,
      },
    };
  }
}

export const authService = new AuthService({
  createReferralCode: createUniqueReferralCode,
  hashPassword: (password) => bcrypt.hash(password, 12),
  sendWelcomeEmail,
  users: userRepository,
});
