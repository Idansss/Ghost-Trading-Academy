import { prisma } from "@/lib/prisma";

export async function GET() {
  const startedAt = Date.now();

  try {
    await prisma.$queryRaw`SELECT 1`;
    return Response.json({
      ok: true,
      service: "database",
      latencyMs: Date.now() - startedAt,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown database error";

    return Response.json(
      {
        ok: false,
        service: "database",
        latencyMs: Date.now() - startedAt,
        timestamp: new Date().toISOString(),
        message,
      },
      { status: 503 },
    );
  }
}
