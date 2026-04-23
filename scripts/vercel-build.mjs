import { spawnSync } from "node:child_process";

function run(command, extraEnv = {}) {
  const result = spawnSync(command, {
    shell: true,
    stdio: ["inherit", "inherit", "pipe"],
    env: { ...process.env, ...extraEnv },
  });

  if (result.error) {
    throw result.error;
  }

  const stderr = result.stderr?.toString() ?? "";
  if (stderr) {
    process.stderr.write(stderr);
  }

  if (result.status !== 0) {
    const err = new Error(
      stderr.trim() || `Command failed with exit code ${result.status}: ${command}`,
    );
    err.stderr = stderr;
    throw err;
  }
}

function getDirectUrl() {
  if (process.env.DIRECT_URL) {
    return process.env.DIRECT_URL;
  }

  if (!process.env.DATABASE_URL) {
    return undefined;
  }

  try {
    const parsed = new URL(process.env.DATABASE_URL);
    parsed.hostname = parsed.hostname.replace(/-pooler\./, ".");
    return parsed.toString();
  } catch {
    return process.env.DATABASE_URL.replace(/-pooler\./, ".");
  }
}

function isAdvisoryLockTimeout(error) {
  const message =
    error instanceof Error
      ? `${error.message}\n${error.stderr ?? ""}`
      : typeof error === "string"
        ? error
        : String(error);

  return (
    message.includes("Timed out trying to acquire a postgres advisory lock") ||
    message.includes("pg_advisory_lock") ||
    message.includes("P1002")
  );
}

function wait(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function runProductionMigrations() {
  const directUrl = getDirectUrl();
  const migrateEnv = directUrl ? { DIRECT_URL: directUrl } : {};

  try {
    run("npx prisma migrate deploy", migrateEnv);
  } catch (error) {
    if (!isAdvisoryLockTimeout(error)) {
      throw error;
    }

    console.warn(
      "[vercel-build] prisma migrate deploy timed out on the advisory lock; retrying once with advisory locking disabled.",
    );

    await wait(12_000);
    run("npx prisma migrate deploy", {
      ...migrateEnv,
      PRISMA_SCHEMA_DISABLE_ADVISORY_LOCK: "1",
    });
  }
}

if (process.env.VERCEL_ENV === "production") {
  await runProductionMigrations();
}

run("npm run build");
