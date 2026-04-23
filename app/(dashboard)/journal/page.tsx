"use client";

import type { Trade } from "@prisma/client";
import { BookOpenText, DownloadCloud, Plus } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useSearchParams as useNextSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/PageHeader";
import { MetricCard } from "@/components/shared/MetricCard";
import { PageTransition } from "@/components/layout/PageTransition";
import { AddTradeModal } from "@/components/journal/AddTradeModal";
import { MonthSelector } from "@/components/journal/MonthSelector";
import { TradeDetailDrawer } from "@/components/journal/TradeDetailDrawer";
import { TradeFilters, type TradeFilterState } from "@/components/journal/TradeFilters";
import { TradeTable } from "@/components/journal/TradeTable";
import { JournalSkeleton } from "@/components/skeletons/JournalSkeleton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { useTrades } from "@/hooks/useTrades";
import { MONTH_NAMES } from "@/lib/constants";
import { exportTradesToCSV, formatPercent } from "@/lib/utils";

const currentMonth = `${MONTH_NAMES[new Date().getMonth()]}_${new Date().getFullYear()}`;

function toSearchParams(month: string, filters: TradeFilterState) {
  const searchParams = new URLSearchParams();
  searchParams.set("month", month);
  Object.entries(filters).forEach(([key, value]) => {
    if (value) {
      searchParams.set(key, value);
    }
  });
  return searchParams;
}

export default function JournalPage() {
  const nextSearchParams = useNextSearchParams();
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [filters, setFilters] = useState<TradeFilterState>({
    search: "",
    outcome: "ALL",
    direction: "ALL",
    setup: "",
    from: "",
    to: "",
  });
  const [isAddOpen, setIsAddOpen] = useState(false);

  // Pre-fill from calculator: ?entry=&stopLoss=&takeProfit=&rr=
  const [prefill, setPrefill] = useState<{
    entryPrice?: number;
    stopLoss?: number;
    takeProfit?: number;
    rrRatio?: number;
  } | null>(null);

  useEffect(() => {
    const entry = nextSearchParams.get("entry");
    const stopLoss = nextSearchParams.get("stopLoss");
    const takeProfit = nextSearchParams.get("takeProfit");
    const rr = nextSearchParams.get("rr");
    if (entry && stopLoss && takeProfit) {
      setPrefill({
        entryPrice: Number(entry),
        stopLoss: Number(stopLoss),
        takeProfit: Number(takeProfit),
        rrRatio: rr ? Number(rr) : undefined,
      });
      setIsAddOpen(true);
    }
  }, [nextSearchParams]);
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const searchParams = useMemo(
    () => toSearchParams(selectedMonth, filters),
    [filters, selectedMonth],
  );
  const { data, isLoading, isError, refetch, createTrade } = useTrades(searchParams);
  const filteredTrades = data?.trades ?? [];
  const kpiCards = data
    ? [
        {
          label: "Total P&L",
          value: formatPercent(data.summary.totalPnl),
          tone: data.summary.totalPnl >= 0 ? ("positive" as const) : ("negative" as const),
        },
        { label: "Win Rate", value: `${data.summary.winRate.toFixed(1)}%` },
        { label: "Total Trades", value: `${data.summary.totalTrades}` },
        { label: "Avg R:R", value: `${data.summary.avgRR.toFixed(2)}R` },
        {
          label: "Best Trade",
          value: formatPercent(data.summary.bestTrade),
          tone: "positive" as const,
        },
        {
          label: "Worst Trade",
          value: formatPercent(data.summary.worstTrade),
          tone: "negative" as const,
        },
      ]
    : [];

  const handleExport = () => {
    if (!filteredTrades.length) {
      toast.warning("No trades to export");
      return;
    }
    const monthLabel = selectedMonth.toLowerCase();
    const year = new Date().getFullYear();
    exportTradesToCSV(filteredTrades, `ghost-journal-${monthLabel}-${year}.csv`);
    toast.success(`Exported ${filteredTrades.length} trades to CSV`);
  };

  const snapshotEntries = Object.entries(data?.summary.snapshot ?? {});

  return (
    <PageTransition>
    <div className="space-y-6">
      <PageHeader
        eyebrow="Journal"
        title="My Trading Journal"
        description="Track setups, performance, and context with real monthly analytics."
        action={
          <div className="flex gap-3">
            <Button asChild variant="outline">
              <Link href="/journal/import">Import CSV</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/journal/weekly-review">Weekly Review</Link>
            </Button>
            <Button variant="outline" onClick={handleExport}>
              <DownloadCloud className="mr-2 h-4 w-4" />
              Export
            </Button>
            <Button
              onClick={() => {
                setIsAddOpen(true);
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Trade
            </Button>
          </div>
        }
      />

      <MonthSelector value={selectedMonth} onValueChange={setSelectedMonth} />
      <TradeFilters value={filters} onChange={setFilters} />

      {isLoading ? (
        <JournalSkeleton />
      ) : isError ? (
        <ErrorState
          title="Journal unavailable"
          description="There was a problem loading your trades."
          onRetry={() => {
            void refetch();
          }}
        />
      ) : !data ? (
        <JournalSkeleton />
      ) : (
        <>
          {!data.summary.loggedToday && data.summary.journalStreak > 2 ? (
            <div className="rounded-3xl border border-primary/20 bg-primary/10 p-5">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-semibold text-primary">Protect your streak</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    You&apos;re on a {data.summary.journalStreak}-day journal streak. Log one trade today to keep the run alive.
                  </p>
                </div>
                <Button
                  onClick={() => {
                    setIsAddOpen(true);
                  }}
                >
                  Log today&apos;s trade
                </Button>
              </div>
            </div>
          ) : null}

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
            {kpiCards.map((card, index) => (
              <motion.div
                key={card.label}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.06, duration: 0.22 }}
              >
                <MetricCard {...card} />
              </motion.div>
            ))}
          </div>

          {filteredTrades.length ? (
            <Card>
              <CardHeader>
                <CardTitle>Trade Log</CardTitle>
              </CardHeader>
              <CardContent>
                <TradeTable
                  trades={filteredTrades}
                  onRowClick={(trade) => {
                    setSelectedTrade(trade);
                    setIsDetailOpen(true);
                  }}
                />
              </CardContent>
            </Card>
          ) : (
            <EmptyState
              icon={<BookOpenText />}
              title="No trades yet"
              description="Start logging your trades to track your performance and grow as a trader."
              action={{
                label: "+ Log your first trade",
                onClick: () => setIsAddOpen(true),
              }}
            />
          )}

          <Card>
            <CardHeader>
              <CardTitle>Monthly Snapshot</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {snapshotEntries.map(([month, pnl]) => (
                <div
                  key={month}
                  className={`rounded-2xl border p-4 ${
                    pnl > 0
                      ? "border-[color:var(--color-green)]/20 bg-[color:var(--color-green-light)]"
                      : pnl < 0
                        ? "border-[color:var(--color-red)]/20 bg-[color:var(--color-red-light)]"
                        : "border-border bg-muted/40"
                  }`}
                >
                  <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
                    {month}
                  </p>
                  <p className="mt-2 text-xl font-semibold">{formatPercent(pnl)}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </>
      )}

      <AddTradeModal
        open={isAddOpen}
        onOpenChange={(open) => {
          setIsAddOpen(open);
          if (!open) setPrefill(null);
        }}
        prefill={prefill ?? undefined}
        isSubmitting={createTrade.isPending}
        onSubmit={async (values) => {
          await createTrade.mutateAsync(values);
        }}
      />

      <TradeDetailDrawer
        trade={selectedTrade}
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
        onTradeUpdated={(trade) => {
          setSelectedTrade(trade);
        }}
        onTradeDeleted={() => {
          setSelectedTrade(null);
        }}
      />
    </div>
    </PageTransition>
  );
}
