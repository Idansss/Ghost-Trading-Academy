import { execSync } from "node:child_process";

function run(command, extraEnv = {}) {
  execSync(command, {
    stdio: "inherit",
    env: { ...process.env, ...extraEnv },
  });
}

if (process.env.VERCEL_ENV === "production") {
  // Prisma migrate deploy needs a direct (non-pooled) connection to acquire the
  // PostgreSQL advisory lock used to serialise concurrent deployments. Neon's
  // pooled endpoint (hostname contains "-pooler") routes through PgBouncer,
  // which does not support session-level advisory locks and causes a timeout.
  //
  // Derive the direct URL automatically: strip "-pooler" from the hostname.
  // If DIRECT_URL is already set (e.g. added manually in Vercel), use it as-is.
  const directUrl =
    process.env.DIRECT_URL ??
    (process.env.DATABASE_URL
      ? process.env.DATABASE_URL.replace(/-pooler\./, ".")
      : undefined);

  run("npx prisma migrate deploy", directUrl ? { DIRECT_URL: directUrl } : {});
}

run("npm run build");
