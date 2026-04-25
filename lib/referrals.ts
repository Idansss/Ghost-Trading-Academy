import { customAlphabet } from "nanoid";
import { prisma } from "@/lib/prisma";

// 10 chars from a 32-symbol alphabet gives ~50 bits of entropy — far more collision-resistant
// than the previous 8-char code. I/O/0/1 omitted to avoid visual ambiguity.
const generateCode = customAlphabet("ABCDEFGHJKLMNPQRSTUVWXYZ23456789", 10);

export async function createUniqueReferralCode() {
  for (let i = 0; i < 5; i += 1) {
    const code = generateCode();
    const exists = await prisma.user.findUnique({
      where: { referralCode: code },
      select: { id: true },
    });
    if (!exists) return code;
  }
  throw new Error("Unable to generate unique referral code after 5 attempts.");
}
