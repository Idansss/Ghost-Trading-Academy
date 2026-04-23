import { success } from "@/server/core/http";

export const dynamic = "force-dynamic";

export async function GET() {
  return success({
    status: "ok",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
}
