"use client";

import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchJson } from "@/lib/client-api";

export default function AdminReportsPage() {
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const [jobId, setJobId] = useState<string | null>(null);

  const sendMutation = useMutation({
    mutationFn: () =>
      fetchJson<{ jobId: string; status: string }>("/api/admin/reports/monthly", {
        method: "POST",
        body: JSON.stringify({ month }),
      }),
    onSuccess: (payload) => setJobId(payload.jobId),
  });

  const statusQuery = useQuery({
    queryKey: ["monthly-report-job", jobId],
    enabled: Boolean(jobId),
    queryFn: () => fetchJson<{ status: string; error?: string }>(`/api/admin/reports/monthly?jobId=${jobId}`),
    refetchInterval: 3000,
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Reports</h1>
      <Card>
        <CardHeader>
          <CardTitle>Send Report to All Members</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2">
            <input
              type="month"
              aria-label="Select month"
              title="Select month"
              value={month}
              onChange={(event) => setMonth(event.target.value)}
              className="h-10 rounded-xl border border-border bg-background px-3 text-sm"
            />
            <Button disabled={sendMutation.isPending} onClick={() => sendMutation.mutate()}>
              {sendMutation.isPending ? "Queueing..." : "Send Report to All Members"}
            </Button>
          </div>
          {jobId ? (
            <p className="text-sm text-muted-foreground">
              Job {jobId}: {statusQuery.data?.status ?? "QUEUED"}
              {statusQuery.data?.error ? ` (${statusQuery.data.error})` : ""}
            </p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
