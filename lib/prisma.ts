import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

// DIRECT_URL is only needed for prisma migrate deploy (bypasses PgBouncer advisory lock).
// If not set (e.g. the Vercel project doesn't have a separate direct connection),
// fall back to DATABASE_URL so Prisma can still initialize at runtime.
if (!process.env.DIRECT_URL && process.env.DATABASE_URL) {
  process.env.DIRECT_URL = process.env.DATABASE_URL;
}

function createPrismaClient() {
  const client = new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
  // Pre-warm the connection so the first request isn't blocked by a Neon cold-start.
  void client.$connect().catch(() => {
    // Retried automatically on the first query.
  });
  return client;
}

// Always cache on the global object — in production Vercel keeps function
// instances warm between invocations, so reusing the client avoids creating
// a new connection on every request and exhausting Neon's connection limit.
if (!global.prisma) {
  global.prisma = createPrismaClient();
}

export const prisma = global.prisma;
