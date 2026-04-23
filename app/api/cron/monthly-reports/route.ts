import { enqueueSendMonthlyReports } from "@/lib/reports/queue";

export async function GET() {
  const now = new Date();
  const previousMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const month = `${previousMonthDate.getFullYear()}-${String(previousMonthDate.getMonth() + 1).padStart(2, "0")}`;
  const jobId = enqueueSendMonthlyReports(month);
  return Response.json({ ok: true, jobId, month });
}
