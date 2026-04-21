"use client";

import { useQuery } from "@tanstack/react-query";
import { PageTransition } from "@/components/layout/PageTransition";
import { MetricCard } from "@/components/shared/MetricCard";
import { PageHeader } from "@/components/shared/PageHeader";
import { ErrorState } from "@/components/ui/ErrorState";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchJson } from "@/lib/client-api";

export default function AdminOverviewPage() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["admin-overview"],
    queryFn: () =>
      fetchJson<{
        totalMembers: number;
        totalVipMembers: number;
        totalSignalsThisMonth: number;
        totalTradesLogged: number;
      }>("/api/admin/overview"),
  });

  if (isError) {
    return (
      <ErrorState
        title="Admin overview unavailable"
        description="There was a problem loading the admin metrics."
        onRetry={() => {
          void refetch();
        }}
      />
    );
  }

  if (isLoading || !data) {
    return <Skeleton className="h-[280px] w-full" />;
  }

  return (
    <PageTransition>
    <div className="space-y-6">
      <PageHeader
        eyebrow="Admin"
        title="Admin Overview"
        description="Manage members, publish desk content, and monitor platform activity."
      />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <MetricCard label="Total Members" value={`${data.totalMembers}`} />
        <MetricCard label="VIP Members" value={`${data.totalVipMembers}`} />
        <MetricCard label="Signals This Month" value={`${data.totalSignalsThisMonth}`} />
        <MetricCard label="Trades Logged" value={`${data.totalTradesLogged}`} />
      </div>
    </div>
    </PageTransition>
  );
}
