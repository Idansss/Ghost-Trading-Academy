"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { fetchJson } from "@/lib/client-api";

type WatchlistItem = {
  id: string;
  symbol: string;
  notes: string | null;
  alertPrice: number | null;
};

export default function WatchlistPage() {
  const queryClient = useQueryClient();
  const [symbol, setSymbol] = useState("BTCUSDT");

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
        watchlistSymbols.map(async (symbol) => {
          const binance = await fetch(
            `https://api.binance.com/api/v3/ticker/24hr?symbol=${encodeURIComponent(symbol)}`,
          ).catch(() => null);
          if (binance?.ok) {
            const payload = (await binance.json()) as { lastPrice?: string; priceChangePercent?: string };
            if (typeof payload.lastPrice === "string") {
              return { symbol, lastPrice: payload.lastPrice, priceChangePercent: String(payload.priceChangePercent ?? "0") };
            }
          }
          const bybit = await fetch(
            `https://api.bybit.com/v5/market/tickers?category=spot&symbol=${encodeURIComponent(symbol)}`,
          ).catch(() => null);
          if (bybit?.ok) {
            const body = (await bybit.json()) as { result?: { list?: Array<{ lastPrice?: string; price24hPcnt?: string }> } };
            const row = body.result?.list?.[0];
            if (row?.lastPrice) {
              const pct = Number(row.price24hPcnt ?? 0);
              return { symbol, lastPrice: row.lastPrice, priceChangePercent: (pct * 100).toFixed(4) };
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
          />
          <Button onClick={() => addMutation.mutate()} disabled={addMutation.isPending || !symbol}>
            Add
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-3">
        {(watchlistQuery.data?.items ?? []).map((item) => {
          const ticker = tickerMap.get(item.symbol);
          return (
            <Card key={item.id}>
              <CardContent className="flex items-center justify-between py-4">
                <div>
                  <p className="font-semibold">{item.symbol}</p>
                  <p className="text-sm text-muted-foreground">
                    Price: {ticker ? Number(ticker.lastPrice).toFixed(4) : "—"} | 24h:{" "}
                    {ticker ? `${Number(ticker.priceChangePercent).toFixed(2)}%` : "—"}
                  </p>
                </div>
                <Button variant="outline" onClick={() => removeMutation.mutate(item.symbol)}>
                  Remove
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
