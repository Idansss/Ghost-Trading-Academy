import { prisma } from "@/lib/prisma";
import { assertTrustedImageUrl } from "@/lib/sanitize";
import { memberWinSchema } from "@/lib/validators";
import { requireAuthenticatedUser } from "@/server/core/auth";
import { created, success } from "@/server/core/http";
import { createRouteHandler } from "@/server/core/route";
import { parseJsonBody, parseSearchParams } from "@/server/core/validation";
import { z } from "zod";

export const dynamic = "force-dynamic";

const memberWinsQuerySchema = z.object({
  all: z.enum(["true", "false"]).optional(),
});

export const GET = createRouteHandler(async ({ request }) => {
  const user = await requireAuthenticatedUser();
  const query = parseSearchParams(request, memberWinsQuerySchema);
  const adminAll = query.all === "true" && user.role === "ADMIN";

  const wins = await prisma.memberWin.findMany({
    where: adminAll ? undefined : { isApproved: true },
    orderBy: { createdAt: "desc" },
    include: {
      user: {
        select: { name: true, avatarUrl: true },
      },
    },
    take: adminAll ? 100 : 30,
  });

  return success({ wins });
});

export const POST = createRouteHandler(async ({ request }) => {
  const user = await requireAuthenticatedUser();
  const data = await parseJsonBody(request, memberWinSchema);

  assertTrustedImageUrl(data.imageUrl ?? null, "imageUrl");

  const win = await prisma.memberWin.create({
    data: {
      coin: data.coin,
      pnlPercent: data.pnlPercent,
      message: data.message,
      imageUrl: data.imageUrl ?? null,
      userId: user.id,
    },
  });

  return created(win);
});
