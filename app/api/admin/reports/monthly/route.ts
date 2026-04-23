import { requireAdmin } from "@/lib/auth";
import { enqueueSendMonthlyReports, getMonthlyJob } from "@/lib/reports/queue";
import { apiError, safeJson } from "@/lib/utils";
import { logAdminAction } from "@/lib/audit-log";

// AUDIT FIX: All authenticated API routes must opt out of static rendering
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin();
    const body = await safeJson<{ month?: string }>(request);
    const month = body.month;
    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return apiError("Month is required in YYYY-MM format.", 400);
    }
    const jobId = enqueueSendMonthlyReports(month);
    await logAdminAction({
      userId: admin.id,
      action: "MONTHLY_REPORT_BROADCAST_QUEUED",
      entity: "MonthlyReportJob",
      entityId: jobId,
      metadata: { month },
    });
    return Response.json({ jobId, status: "QUEUED" });
  } catch (error) {
    console.error(error);
    return apiError("Unable to queue monthly report broadcast.", 500);
  }
}

export async function GET(request: Request) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get("jobId");
    if (!jobId) {
      return apiError("jobId is required.", 400);
    }
    const job = getMonthlyJob(jobId);
    if (!job) {
      return apiError("Job not found.", 404);
    }
    return Response.json(job);
  } catch (error) {
    console.error(error);
    return apiError("Unable to load report job status.", 500);
  }
}
