import type { PrismaClient } from "@prisma/client";
import { addUserToDefaultChatChannels } from "@/lib/chat";
import { prisma } from "@/lib/prisma";

export class UserRepository {
  constructor(private readonly db: PrismaClient = prisma) {}

  async findByEmail(email: string) {
    return this.db.user.findUnique({
      where: { email: email.toLowerCase() },
    });
  }

  async findReferrerByCode(referralCode: string) {
    return this.db.user.findUnique({
      where: { referralCode: referralCode.toUpperCase() },
      select: { id: true },
    });
  }

  async createRegisteredUser(input: {
    name: string;
    email: string;
    passwordHash: string;
    referralCode: string;
    referrerId?: string | null;
  }) {
    return this.db.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: input.name,
          email: input.email.toLowerCase(),
          password: input.passwordHash,
          referralCode: input.referralCode,
          referredBy: input.referrerId ?? null,
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
        },
      });

      await addUserToDefaultChatChannels(user.id, tx);

      if (input.referrerId) {
        await tx.referral.create({
          data: {
            referrerId: input.referrerId,
            referredId: user.id,
          },
        });
      }

      return user;
    });
  }
}

export const userRepository = new UserRepository();
