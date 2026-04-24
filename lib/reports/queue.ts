import { sendMonthlyReportEmail } from "@/lib/email";
import { generateMonthlyReportBuffer } from "@/lib/reports/monthly";
import { prisma } from "@/lib/prisma";

type JobStatus = "QUEUED" | "RUNNING" | "DONE" | "FAILED";

const jobs = new Map<string, { status: JobStatus; startedAt: Date; error?: string }>();

export function getMonthlyJob(jobId: string) {
  return jobs.get(jobId) ?? null;
}

export function enqueueSendMonthlyReports(month: string) {
  const jobId = `monthly-${month}-${Date.now()}`;
  jobs.set(jobId, { status: "QUEUED", startedAt: new Date() });

  setTimeout(async () => {
    jobs.set(jobId, { status: "RUNNING", startedAt: new Date() });
    try {
      const recipients = await prisma.user.findMany({
        where: { role: { in: ["MEMBER", "PREMIUM"] } },
        select: { id: true, name: true, email: true },
      });
      for (const recipient of recipients) {
        const report = await generateMonthlyReportBuffer(recipient.id, month);
        await sendMonthlyReportEmail(recipient.email, recipient.name, month, report);
      }
      jobs.set(jobId, { status: "DONE", startedAt: new Date() });
    } catch (error) {
      jobs.set(jobId, {
        status: "FAILED",
        startedAt: new Date(),
        error: error instanceof Error ? error.message : "Unknown failure",
      });
    }
  }, 0);

  return jobId;
}
