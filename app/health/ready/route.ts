import { prisma } from "@/lib/prisma";
import { pingRedis } from "@/lib/redis";
import { success } from "@/server/core/http";

export const dynamic = "force-dynamic";

export async function GET() {
  const [databaseCheck, redisCheck] = await Promise.allSettled([
    prisma.$queryRaw`SELECT 1`,
    pingRedis(),
  ]);

  const databaseStatus = databaseCheck.status === "fulfilled" ? "ok" : "down";
  const redisStatus =
    redisCheck.status === "fulfilled"
      ? redisCheck.value.configured
        ? "ok"
        : "not_configured"
      : "down";

  const ready = databaseStatus === "ok" && redisStatus !== "down";

  return success(
    {
      status: ready ? "ready" : "not_ready",
      timestamp: new Date().toISOString(),
      checks: {
        database: databaseStatus,
        redis: redisStatus,
      },
    },
    {
      status: ready ? 200 : 503,
    },
  );
}
