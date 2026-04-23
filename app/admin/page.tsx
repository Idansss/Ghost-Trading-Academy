"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNowStrict } from "date-fns";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageTransition } from "@/components/layout/PageTransition";
import { MetricCard } from "@/components/shared/MetricCard";
import { PageHeader } from "@/components/shared/PageHeader";
import { ErrorState } from "@/components/ui/ErrorState";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchJson } from "@/lib/client-api";
import { getSignalStatusVariant } from "@/lib/signal-performance";

type ActivityItem = {
  type: "member" | "signal" | "win";
  label: string;
  time: string;
};

type SignalThisWeek = {
  id: string;
  coin: string;
  direction: string;
  status: string;
  rrRatio: number;
  postedAt: string;
};

type AdminOverviewData = {
  totalMembers: number;
  totalVipUsers: number;
  totalSignalsThisMonth: number;
  totalTradesLogged: number;
  activityFeed: ActivityItem[];
  signupChart: { date: string; count: number }[];
  signalsThisWeek: SignalThisWeek[];
};

const activityVariant = (type: string) => {
  if (type === "member") return "success";
  if (type === "signal") return "info";
  return "warning";
};

export default function AdminOverviewPage() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["admin-overview"],
    queryFn: () => fetchJson<AdminOverviewData>("/api/admin/overview"),
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
          action={
            <Button asChild>
              <Link href="/admin/site-config">Edit Site Config</Link>
            </Button>
          }
        />

        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <MetricCard label="Total Members" value={`${data.totalMembers}`} />
          <MetricCard label="VIP Users" value={`${data.totalVipUsers}`} />
          <MetricCard label="Signals This Month" value={`${data.totalSignalsThisMonth}`} />
          <MetricCard label="Trades Logged" value={`${data.totalTradesLogged}`} />
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
          <Card>
            <CardHeader>
              <CardTitle>Member Signups – Last 30 Days</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={data.signupChart} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10 }}
                    tickFormatter={(v: string) => {
                      const d = new Date(v);
                      return `${d.getMonth() + 1}/${d.getDate()}`;
                    }}
                    interval={6}
                  />
                  <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                  <Tooltip
                    labelFormatter={(v) => String(v)}
                    formatter={(v) => [`${v} signups`, "Signups"]}
                    contentStyle={{ fontSize: 12 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="var(--color-primary)"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Signals This Week</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {data.signalsThisWeek.length ? (
                data.signalsThisWeek.map((signal) => (
                  <div
                    key={signal.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-border px-3 py-2.5"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium">
                        {signal.coin}
                        <span className="ml-1.5 text-xs text-muted-foreground">
                          {signal.direction}
                        </span>
                      </p>
                      <p className="text-xs text-muted-foreground">{signal.rrRatio.toFixed(2)}R</p>
                    </div>
                    <Badge
                      variant={getSignalStatusVariant(signal.status as never)}
                    >
                      {signal.status}
                    </Badge>
                  </div>
                ))
              ) : (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  No signals posted this week.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.activityFeed.length ? (
              data.activityFeed.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between gap-3 rounded-xl border border-border px-3 py-2.5"
                >
                  <div className="flex items-center gap-3">
                    <Badge variant={activityVariant(item.type)} className="shrink-0">
                      {item.type}
                    </Badge>
                    <p className="text-sm">{item.label}</p>
                  </div>
                  <p className="shrink-0 text-xs text-muted-foreground">
                    {formatDistanceToNowStrict(new Date(item.time), { addSuffix: true })}
                  </p>
                </div>
              ))
            ) : (
              <p className="py-6 text-center text-sm text-muted-foreground">No recent activity.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </PageTransition>
  );
}
