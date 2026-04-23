import { execSync } from "node:child_process";

function run(command) {
  execSync(command, {
    stdio: "inherit",
    env: process.env,
  });
}

if (process.env.VERCEL_ENV === "production") {
  run("npx prisma migrate deploy");
}

run("npm run build");
