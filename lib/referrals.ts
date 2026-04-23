import { customAlphabet } from "nanoid";
import { prisma } from "@/lib/prisma";

const generateCode = customAlphabet("ABCDEFGHJKLMNPQRSTUVWXYZ23456789", 8);

export async function createUniqueReferralCode() {
  for (let i = 0; i < 10; i += 1) {
    const code = generateCode();
    const exists = await prisma.user.findUnique({
      where: { referralCode: code },
      select: { id: true },
    });
    if (!exists) return code;
  }
  throw new Error("Unable to generate unique referral code.");
}
