"use client";

import type { Trade } from "@prisma/client";
import type { DateRange } from "react-day-picker";
import { CalendarDays, DownloadCloud } from "lucide-react";
import { endOfYear, format, startOfYear, subDays } from "date-fns";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { AnalyticsMultiSelect } from "@/components/analytics/AnalyticsMultiSelect";
import { InsightCards } from "@/components/analytics/InsightCards";
import { PsychologyReport } from "@/components/analytics/PsychologyReport";
import { PageTransition } from "@/components/layout/PageTransition";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { AnalyticsSkeleton } from "@/components/skeletons/AnalyticsSkeleton";
import { MonthlyTable } from "@/components/analytics/MonthlyTable";
import { PerformanceCharts } from "@/components/analytics/PerformanceCharts";
import { WinRateGauge } from "@/components/analytics/WinRateGauge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { ErrorState } from "@/components/ui/ErrorState";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { fetchJson } from "@/lib/client-api";
import { exportTradesToCSV } from "@/lib/utils";

type AnalyticsTrade = Trade;

type AnalyticsResponse = {
  trades: AnalyticsTrade[];
  summary: {
    totalTrades: number;
    winRate: number;
  };
  monthlyRows: Array<{
    month: string;
    trades: number;
    wins: number;
    losses: number;
    winRate: number;
    pnl: number;
  }>;
  equityCurve: Array<{ date: string; balance: number }>;
  winLossData: Array<{ name: string; value: number; fill: string }>;
  setupData: Array<{ setup: string; winRate: number }>;
  filterOptions: {
    pairs: Array<{ value: string; label: string }>;
    tags: Array<{ value: string; label: string }>;
  };
  psychology: {
    calmWinRate: number;
    anxiousWinRate: number;
    fearfulWinRate: number;
    avgRFollowedPlan: number;
    avgRNotFollowedPlan: number;
    revengeTradesCount: number;
    revengeTradesPnlImpact: number;
    topEmotionOnWins: string;
    topEmotionOnLosses: string;
    psychologyScore: number;
  };
};

const DATE_RANGE_OPTIONS = [
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" },
  { value: "year", label: "This year" },
  { value: "all", label: "All time" },
  { value: "custom", label: "Custom" },
] as const;

function toIsoDate(date: Date) {
  return format(date, "yyyy-MM-dd");
}

function getPresetDates(range: string) {
  const today = new Date();

  if (range === "7d") {
    return { startDate: toIsoDate(subDays(today, 6)), endDate: toIsoDate(today) };
  }
  if (range === "30d") {
    return { startDate: toIsoDate(subDays(today, 29)), endDate: toIsoDate(today) };
  }
  if (range === "90d") {
    return { startDate: toIsoDate(subDays(today, 89)), endDate: toIsoDate(today) };
  }
  if (range === "year") {
    return { startDate: toIsoDate(startOfYear(today)), endDate: toIsoDate(endOfYear(today)) };
  }

  return { startDate: null, endDate: null };
}

export default function AnalyticsPage() {
  const currentMonth = format(new Date(), "MMM_yyyy").toUpperCase();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [reportMonth, setReportMonth] = useState(format(new Date(), "yyyy-MM"));

  const range = searchParams.get("range") ?? "30d";
  const direction = searchParams.get("direction") ?? "ALL";
  const selectedPairs = searchParams.getAll("pairs");
  const selectedTags = searchParams.getAll("tags");
  const customStartDate = searchParams.get("startDate");
  const customEndDate = searchParams.get("endDate");

  const effectiveDates =
    range === "custom"
      ? {
          startDate: customStartDate,
          endDate: customEndDate,
        }
      : getPresetDates(range);

  const analyticsParams = new URLSearchParams();
  if (range) analyticsParams.set("range", range);
  if (effectiveDates.startDate) analyticsParams.set("startDate", effectiveDates.startDate);
  if (effectiveDates.endDate) analyticsParams.set("endDate", effectiveDates.endDate);
  if (direction !== "ALL") analyticsParams.set("direction", direction);
  selectedPairs.forEach((pair) => analyticsParams.append("pairs", pair));
  selectedTags.forEach((tag) => analyticsParams.append("tags", tag));

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["analytics", analyticsParams.toString()],
    queryFn: () => fetchJson<AnalyticsResponse>(`/api/analytics?${analyticsParams.toString()}`),
  });

  const selectedDateRange: DateRange | undefined =
    effectiveDates.startDate || effectiveDates.endDate
      ? {
          from: effectiveDates.startDate ? new Date(`${effectiveDates.startDate}T00:00:00`) : undefined,
          to: effectiveDates.endDate ? new Date(`${effectiveDates.endDate}T00:00:00`) : undefined,
        }
      : undefined;

  const updateSearch = (mutate: (params: URLSearchParams) => void) => {
    const params = new URLSearchParams(searchParams.toString());
    mutate(params);
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname);
  };

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

  if (!data) {
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
        action={
          <div className="flex items-center gap-2">
            <input
              type="month"
              aria-label="Select report month"
              title="Select report month"
              value={reportMonth}
              onChange={(event) => setReportMonth(event.target.value)}
              className="h-10 rounded-xl border border-border bg-background px-3 text-sm"
            />
            <Button
              variant="outline"
              onClick={() => {
                window.open(`/api/reports/monthly?month=${reportMonth}`, "_blank");
              }}
            >
              <DownloadCloud className="mr-2 h-4 w-4" />
              Download Report
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                if (!data.trades.length) {
                  return;
                }

                exportTradesToCSV(
                  data.trades,
                  `ghost-analytics-${range}-${format(new Date(), "yyyyMMdd")}.csv`,
                );
              }}
            >
              <DownloadCloud className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          </div>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex flex-wrap gap-2">
            {DATE_RANGE_OPTIONS.map((option) => (
              <Button
                key={option.value}
                type="button"
                variant={range === option.value ? "default" : "outline"}
                onClick={() => {
                  updateSearch((params) => {
                    params.set("range", option.value);
                    if (option.value === "custom") {
                      return;
                    }

                    const presetDates = getPresetDates(option.value);
                    params.delete("startDate");
                    params.delete("endDate");
                    if (presetDates.startDate) params.set("startDate", presetDates.startDate);
                    if (presetDates.endDate) params.set("endDate", presetDates.endDate);
                  });
                }}
              >
                {option.label}
              </Button>
            ))}
          </div>

          <div className="grid gap-4 xl:grid-cols-[1.1fr_1.1fr_1fr_0.9fr]">
            <div className="space-y-2">
              <p className="text-sm font-medium">Pair / Coin</p>
              <AnalyticsMultiSelect
                value={selectedPairs}
                options={data.filterOptions.pairs}
                onChange={(nextValue) => {
                  updateSearch((params) => {
                    params.delete("pairs");
                    nextValue.forEach((pair) => params.append("pairs", pair));
                  });
                }}
                placeholder="Filter by one or more pairs"
              />
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Setup Type / Tag</p>
              <AnalyticsMultiSelect
                value={selectedTags}
                options={data.filterOptions.tags}
                onChange={(nextValue) => {
                  updateSearch((params) => {
                    params.delete("tags");
                    nextValue.forEach((tag) => params.append("tags", tag));
                  });
                }}
                placeholder="Filter by setup types and tags"
              />
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Direction</p>
              <Tabs
                value={direction}
                onValueChange={(nextValue) => {
                  updateSearch((params) => {
                    if (nextValue === "ALL") {
                      params.delete("direction");
                    } else {
                      params.set("direction", nextValue);
                    }
                  });
                }}
              >
                <TabsList className="w-full">
                  <TabsTrigger value="ALL">All</TabsTrigger>
                  <TabsTrigger value="LONG">Long</TabsTrigger>
                  <TabsTrigger value="SHORT">Short</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Custom Range</p>
              <Popover>
                <PopoverTrigger asChild>
                  <Button type="button" variant="outline" className="w-full justify-between">
                    <span className="truncate text-left">
                      {selectedDateRange?.from
                        ? selectedDateRange.to
                          ? `${format(selectedDateRange.from, "MMM d, yyyy")} - ${format(selectedDateRange.to, "MMM d, yyyy")}`
                          : format(selectedDateRange.from, "MMM d, yyyy")
                        : "Pick custom dates"}
                    </span>
                    <CalendarDays className="ml-2 h-4 w-4 shrink-0" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="range"
                    numberOfMonths={1}
                    selected={selectedDateRange}
                    onSelect={(nextRange) => {
                      updateSearch((params) => {
                        params.set("range", "custom");
                        if (nextRange?.from) {
                          params.set("startDate", toIsoDate(nextRange.from));
                        } else {
                          params.delete("startDate");
                        }

                        if (nextRange?.to) {
                          params.set("endDate", toIsoDate(nextRange.to));
                        } else {
                          params.delete("endDate");
                        }
                      });
                    }}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <p className="text-sm text-muted-foreground">
            {data.summary.totalTrades
              ? `${data.summary.totalTrades} trade${data.summary.totalTrades === 1 ? "" : "s"} match the active filters.`
              : "No trades match the current filters. Adjust the range, pair, tag, or direction to bring data back into view."}
          </p>
        </CardContent>
      </Card>

      {data.trades.length ? (
        <>
          <MonthlyTable rows={data.monthlyRows} currentMonth={currentMonth} />

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.2fr_2fr]">
            <WinRateGauge value={data.summary.winRate} />
            <PerformanceCharts
              monthlyRows={data.monthlyRows.map((row) => ({
                month: row.month.replace("_", " "),
                pnl: row.pnl,
              }))}
              equityCurve={data.equityCurve}
              winLossData={data.winLossData}
              setupData={data.setupData}
            />
          </div>

          <section>
            <h2 className="mb-4 text-sm font-medium text-primary">Performance insights</h2>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <InsightCards trades={data.trades} />
            </div>
          </section>

          <PsychologyReport data={data.psychology} />
        </>
      ) : (
        <EmptyState
          title="No trades match these tags"
          description="Try removing one of the active tag filters to bring trades back into view."
        />
      )}
    </div>
    </PageTransition>
  );
}
