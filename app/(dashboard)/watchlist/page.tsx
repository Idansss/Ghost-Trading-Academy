"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronDown, ChevronUp, Info } from "lucide-react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ChartSkeleton } from "@/components/charts/ChartSkeleton";
import { fetchJson } from "@/lib/client-api";
import { normalizeChartSymbol } from "@/lib/chart-utils";

const TradingViewAdvancedWidget = dynamic(
  () =>
    import("@/components/charts/TradingViewAdvancedWidget").then(
      (m) => m.TradingViewAdvancedWidget,
    ),
  { ssr: false, loading: () => <ChartSkeleton height={500} /> },
);

type WatchlistItem = {
  id: string;
  symbol: string;
  notes: string | null;
  alertPrice: number | null;
};

export default function WatchlistPage() {
  const queryClient = useQueryClient();
  const [symbol, setSymbol] = useState("BTCUSDT");
  // CLAUDE IMPROVEMENT: Only one chart open at a time — better for performance
  // on long watchlists since each open chart fetches and renders candle data.
  const [expandedSymbol, setExpandedSymbol] = useState<string | null>(null);

  const watchlistQuery = useQuery({
    queryKey: ["watchlist"],
    queryFn: () => fetchJson<{ items: WatchlistItem[] }>("/api/watchlist"),
    refetchInterval: 60_000,
  });

  const watchlistSymbols = useMemo(
    () =>
      (watchlistQuery.data?.items ?? [])
        .map((item) => item.symbol)
        .slice()
        .sort(),
    [watchlistQuery.data?.items],
  );

  const tickerQuery = useQuery({
    queryKey: ["watchlist-ticker", watchlistSymbols],
    enabled: watchlistSymbols.length > 0,
    queryFn: async () => {
      const results = await Promise.all(
        watchlistSymbols.map(async (sym) => {
          const binance = await fetch(
            `https://api.binance.com/api/v3/ticker/24hr?symbol=${encodeURIComponent(sym)}`,
          ).catch(() => null);
          if (binance?.ok) {
            const payload = (await binance.json()) as { lastPrice?: string; priceChangePercent?: string };
            if (typeof payload.lastPrice === "string") {
              return { symbol: sym, lastPrice: payload.lastPrice, priceChangePercent: String(payload.priceChangePercent ?? "0") };
            }
          }
          const bybit = await fetch(
            `https://api.bybit.com/v5/market/tickers?category=spot&symbol=${encodeURIComponent(sym)}`,
          ).catch(() => null);
          if (bybit?.ok) {
            const body = (await bybit.json()) as { result?: { list?: Array<{ lastPrice?: string; price24hPcnt?: string }> } };
            const row = body.result?.list?.[0];
            if (row?.lastPrice) {
              const pct = Number(row.price24hPcnt ?? 0);
              return { symbol: sym, lastPrice: row.lastPrice, priceChangePercent: (pct * 100).toFixed(4) };
            }
          }
          return null;
        }),
      );
      return results.filter((r): r is { symbol: string; lastPrice: string; priceChangePercent: string } => r !== null);
    },
    refetchInterval: 10_000,
  });

  const tickerMap = useMemo(
    () =>
      new Map((tickerQuery.data ?? []).map((item) => [item.symbol, item])),
    [tickerQuery.data],
  );

  const addMutation = useMutation({
    mutationFn: () =>
      fetchJson("/api/watchlist", {
        method: "POST",
        body: JSON.stringify({ symbol }),
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["watchlist"] });
      setSymbol("");
    },
  });

  const removeMutation = useMutation({
    mutationFn: (target: string) => fetchJson(`/api/watchlist/${target}`, { method: "DELETE" }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["watchlist"] });
    },
  });

  function toggleChart(sym: string) {
    setExpandedSymbol((prev) => (prev === sym ? null : sym));
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Watchlist</h1>
      <Card>
        <CardHeader>
          <CardTitle>Add coin pair</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-2">
          <Input
            placeholder="BTCUSDT"
            value={symbol}
            onChange={(event) => setSymbol(event.target.value.toUpperCase())}
            onKeyDown={(e) => {
              if (e.key === "Enter" && symbol && !addMutation.isPending) {
                addMutation.mutate();
              }
            }}
          />
          <Button onClick={() => addMutation.mutate()} disabled={addMutation.isPending || !symbol}>
            Add
          </Button>
        </CardContent>
      </Card>

      {/* CLAUDE FIX: Inform members they can sign into TradingView to persist drawings across sessions */}
      <div className="flex items-start gap-2 rounded-lg border border-border bg-muted/40 p-3 text-xs text-muted-foreground mb-4">
        <Info className="h-4 w-4 flex-shrink-0 mt-0.5" />
        <p>
          <span className="font-medium text-foreground">Tip:</span> Sign in to TradingView from inside any chart (
          <span className="font-medium">top-right of the chart</span>) to save your drawings, indicators, and chart layouts across sessions. A free TradingView account is enough — no upgrade needed.
        </p>
      </div>

      <div className="grid gap-3">
        {(watchlistQuery.data?.items ?? []).map((item) => {
          const ticker = tickerMap.get(item.symbol);
          const pctChange = ticker ? Number(ticker.priceChangePercent) : null;
          const isExpanded = expandedSymbol === item.symbol;

          return (
            <Card key={item.id} className="overflow-hidden">
              <CardContent className="py-4">
                {/* CLAUDE IMPROVEMENT: Header row — symbol, price, 24h change, actions */}
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold truncate">{item.symbol}</p>
                    <div className="flex items-center gap-3 mt-0.5">
                      <p className="text-sm text-muted-foreground">
                        {ticker ? Number(ticker.lastPrice).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 }) : "—"}
                      </p>
                      {pctChange !== null ? (
                        <span
                          className={`text-xs font-medium ${
                            pctChange >= 0 ? "text-[color:var(--color-green)]" : "text-[color:var(--color-red)]"
                          }`}
                        >
                          {pctChange >= 0 ? "+" : ""}
                          {pctChange.toFixed(2)}%
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5 text-xs"
                      onClick={() => toggleChart(item.symbol)}
                      aria-expanded={isExpanded}
                      aria-label={isExpanded ? "Collapse chart" : "View chart"}
                    >
                      {isExpanded ? (
                        <>
                          <ChevronUp className="h-3.5 w-3.5" />
                          Hide chart
                        </>
                      ) : (
                        <>
                          <ChevronDown className="h-3.5 w-3.5" />
                          View chart
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs"
                      onClick={() => removeMutation.mutate(item.symbol)}
                      disabled={removeMutation.isPending}
                    >
                      Remove
                    </Button>
                  </div>
                </div>

                {/* CLAUDE IMPROVEMENT: Inline expandable chart — single symbol at a time */}
                {isExpanded ? (
                  <div className="mt-4">
                    <TradingViewAdvancedWidget
                      symbol={normalizeChartSymbol(item.symbol)}
                      interval="4h"
                      height={500}
                      allowSymbolChange={false}
                    />
                  </div>
                ) : null}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
