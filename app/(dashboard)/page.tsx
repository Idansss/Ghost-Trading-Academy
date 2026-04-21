"use client";

import type { DailyOutlook, Trade } from "@prisma/client";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { EquityChart } from "@/components/dashboard/EquityChart";
import { RecentTradesTable } from "@/components/dashboard/RecentTradesTable";
import { StatsGrid } from "@/components/dashboard/StatsGrid";
import { PageTransition } from "@/components/layout/PageTransition";
import { DashboardSkeleton } from "@/components/skeletons/DashboardSkeleton";
import { PageHeader } from "@/components/shared/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ErrorState } from "@/components/ui/ErrorState";
import { fetchJson } from "@/lib/client-api";
import { formatPercent } from "@/lib/utils";

export default function DashboardPage() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["dashboard"],
    queryFn: () =>
      fetchJson<{
        kpis: {
          totalPnl: number;
          winRate: number;
          avgRR: number;
          totalTrades: number;
        };
        equityCurve: Array<{ date: string; balance: number }>;
        monthlySnapshot: Record<string, number>;
        recentTrades: Trade[];
        latestOutlook: DailyOutlook | null;
        activeSignals: number;
      }>("/api/dashboard"),
  });

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (error || !data) {
    return (
      <ErrorState
        title="Dashboard unavailable"
        description="We could not load your trading data right now."
        onRetry={() => {
          void refetch();
        }}
      />
    );
  }

  const monthlyBars = Object.entries(data.monthlySnapshot).map(([month, pnl]) => ({
    month,
    pnl,
  }));

  return (
    <PageTransition>
    <div className="space-y-6">
      <PageHeader
        eyebrow="Overview"
        title="Trading Command Center"
        description="Track your performance, monitor the latest bias, and move directly into the journal."
      />

      <StatsGrid {...data.kpis} />

      <div className="grid gap-6 xl:grid-cols-[1.65fr_1fr]">
        <div className="space-y-6">
          <EquityChart data={data.equityCurve} />
          <RecentTradesTable trades={data.recentTrades} />
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Monthly P&amp;L</CardTitle>
            </CardHeader>
            <CardContent className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyBars}>
                  <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.15} />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} hide />
                  <YAxis tickLine={false} axisLine={false} />
                  <Tooltip formatter={(value) => formatPercent(Number(value ?? 0))} />
                  <Bar dataKey="pnl" radius={[8, 8, 0, 0]} fill="#B8860B" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Today&apos;s Market Bias</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.latestOutlook ? (
                <>
                  <Badge
                    variant={
                      data.latestOutlook.marketBias === "BULLISH"
                        ? "success"
                        : data.latestOutlook.marketBias === "BEARISH"
                          ? "danger"
                          : data.latestOutlook.marketBias === "RANGING"
                            ? "warning"
                            : "muted"
                    }
                  >
                    <span className="status-dot bg-current" />
                    {data.latestOutlook.marketBias}
                  </Badge>
                  <p className="text-sm text-muted-foreground">
                    {data.latestOutlook.biasExplanation}
                  </p>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No market outlook has been posted yet.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Active Signals</CardTitle>
            </CardHeader>
            <CardContent className="flex items-end justify-between gap-3">
              <div>
                <p className="text-3xl font-semibold">{data.activeSignals}</p>
                <p className="text-sm text-muted-foreground">
                  Live or pending setups on the desk.
                </p>
              </div>
              <Link
                href="/signals"
                className="text-sm font-medium text-primary hover:underline"
              >
                View signals &rarr;
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
    </PageTransition>
  );
}
