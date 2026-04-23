import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiError } from "@/lib/utils";

// AUDIT FIX: All authenticated API routes must opt out of static rendering
export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const user = await requireUser();
    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: {
          twoFactorEnabled: false,
          twoFactorSecret: null,
        },
      }),
      prisma.twoFactorBackupCode.deleteMany({
        where: { userId: user.id },
      }),
    ]);
    return Response.json({ ok: true });
  } catch (error) {
    console.error(error);
    return apiError("Unable to disable 2FA.", 500);
  }
}
