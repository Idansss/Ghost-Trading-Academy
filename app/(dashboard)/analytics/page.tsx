"use client";

import { useMemo } from "react";
import { InsightCards } from "@/components/analytics/InsightCards";
import { PageTransition } from "@/components/layout/PageTransition";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { AnalyticsSkeleton } from "@/components/skeletons/AnalyticsSkeleton";
import { MonthlyTable } from "@/components/analytics/MonthlyTable";
import { PerformanceCharts } from "@/components/analytics/PerformanceCharts";
import { WinRateGauge } from "@/components/analytics/WinRateGauge";
import { ErrorState } from "@/components/ui/ErrorState";
import { useTrades } from "@/hooks/useTrades";
import { getEquityCurve } from "@/lib/calculations";
import { MONTH_NAMES } from "@/lib/constants";
import { getMonthKey } from "@/lib/utils";

export default function AnalyticsPage() {
  const currentMonth = `${MONTH_NAMES[new Date().getMonth()]}_${new Date().getFullYear()}`;
  const { data, isLoading, error, refetch } = useTrades(new URLSearchParams());

  const analytics = useMemo(() => {
    if (!data) return null;
    const grouped = data.trades.reduce<Record<string, typeof data.trades>>((accumulator, trade) => {
      const key = getMonthKey(trade.tradeDate);
      accumulator[key] = [...(accumulator[key] ?? []), trade];
      return accumulator;
    }, {});

    const monthlyRows = Object.entries(grouped).map(([month, trades]) => ({
      month,
      trades: trades.length,
      wins: trades.filter((trade) => trade.outcome === "WIN").length,
      losses: trades.filter((trade) => trade.outcome === "LOSS").length,
      winRate: trades.length
        ? (trades.filter((trade) => trade.outcome === "WIN").length / trades.length) * 100
        : 0,
      pnl: trades.reduce((sum, trade) => sum + trade.pnlPercent, 0),
    }));

    const currentMonthTrades = grouped[currentMonth] ?? [];

    return {
      monthlyRows,
      currentMonthWinRate: currentMonthTrades.length
        ? (currentMonthTrades.filter((trade) => trade.outcome === "WIN").length /
            currentMonthTrades.length) *
          100
        : 0,
      equityCurve: getEquityCurve(data.trades, 10000),
      winLossData: [
        {
          name: "Wins",
          value: currentMonthTrades.filter((trade) => trade.outcome === "WIN").length,
          fill: "#2D6A0F",
        },
        {
          name: "Losses",
          value: currentMonthTrades.filter((trade) => trade.outcome === "LOSS").length,
          fill: "#8B2020",
        },
      ],
      setupData: Object.entries(
        data.trades.reduce<Record<string, { wins: number; total: number }>>(
          (accumulator, trade) => {
            if (!accumulator[trade.setupType]) {
              accumulator[trade.setupType] = { wins: 0, total: 0 };
            }
            accumulator[trade.setupType].total += 1;
            if (trade.outcome === "WIN") {
              accumulator[trade.setupType].wins += 1;
            }
            return accumulator;
          },
          {},
        ),
      ).map(([setup, value]) => ({
        setup,
        winRate: value.total ? (value.wins / value.total) * 100 : 0,
      })),
    };
  }, [currentMonth, data]);

  if (isLoading) {
    return <AnalyticsSkeleton />;
  }

  if (error) {
    return (
      <ErrorState
        title="Analytics unavailable"
        description="There was a problem loading your performance data."
        onRetry={() => {
          void refetch();
        }}
      />
    );
  }

  if (!analytics || !data?.trades.length) {
    return (
      <EmptyState
        title="No analytics yet"
        description="Add a few trades to unlock monthly and setup performance analytics."
      />
    );
  }

  return (
    <PageTransition>
    <div className="space-y-6">
      <PageHeader
        eyebrow="Analytics"
        title="Performance Intelligence"
        description="Deep analysis of your trade journal, including setup edge and weekday behavior."
      />

      <MonthlyTable rows={analytics.monthlyRows} currentMonth={currentMonth} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.2fr_2fr]">
        <WinRateGauge value={analytics.currentMonthWinRate} />
        <PerformanceCharts
          monthlyRows={analytics.monthlyRows.map((row) => ({
            month: row.month.slice(0, 3),
            pnl: row.pnl,
          }))}
          equityCurve={analytics.equityCurve}
          winLossData={analytics.winLossData}
          setupData={analytics.setupData}
        />
      </div>

      <section>
        <h2 className="mb-4 text-sm font-medium text-primary">Performance insights</h2>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <InsightCards trades={data.trades} />
        </div>
      </section>
    </div>
    </PageTransition>
  );
}
