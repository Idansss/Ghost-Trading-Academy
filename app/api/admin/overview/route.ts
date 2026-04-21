import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiError, getMonthKey } from "@/lib/utils";

export async function GET() {
  try {
    await requireAdmin();
    const month = getMonthKey(new Date());

    const [totalMembers, totalVipMembers, totalSignalsThisMonth, totalTradesLogged] =
      await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { role: "VIP" } }),
        prisma.signal.count({
          where: {
            postedAt: {
              gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
            },
          },
        }),
        prisma.trade.count({
          where: { month },
        }),
      ]);

    return Response.json({
      totalMembers,
      totalVipMembers,
      totalSignalsThisMonth,
      totalTradesLogged,
    });
  } catch {
    return apiError("Unable to load admin overview.", 500);
  }
}
