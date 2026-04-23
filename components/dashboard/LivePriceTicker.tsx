"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowDownRight, ArrowUpRight, WifiOff } from "lucide-react";
import { DEFAULT_TICKER_SYMBOLS, SUPPORTED_TICKER_SYMBOLS } from "@/lib/constants";
import { cn } from "@/lib/utils";

type TickerItem = {
  symbol: string;
  label: string;
  price: number;
  changePercent: number;
  source: "websocket" | "fallback";
};

type SymbolMeta = {
  symbol: string;
  label: string;
  coingeckoId: string;
};

const symbolMeta = new Map<string, SymbolMeta>(
  SUPPORTED_TICKER_SYMBOLS.map((item) => [
    item.symbol,
    { symbol: item.symbol, label: item.label, coingeckoId: item.coingeckoId },
  ]),
);

function formatPrice(value: number) {
  const digits =
    value >= 1000 ? 2 : value >= 1 ? 3 : value >= 0.1 ? 4 : 6;

  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: digits,
  }).format(value);
}

export function LivePriceTicker({ symbols }: { symbols: string[] }) {
  const normalizedSymbols = useMemo(() => {
    const unique = Array.from(new Set(symbols.map((symbol) => symbol.toUpperCase())));
    return unique.length ? unique : [...DEFAULT_TICKER_SYMBOLS];
  }, [symbols]);
  const [prices, setPrices] = useState<Record<string, TickerItem>>({});
  // AUDIT FIX: Added "disconnected" as a valid state for when max retries are exceeded.
  const [connectionState, setConnectionState] = useState<
    "connecting" | "connected" | "reconnecting" | "disconnected"
  >("connecting");
  const retryTimeoutRef = useRef<number | null>(null);
  const websocketRef = useRef<WebSocket | null>(null);

  const fallbackQuery = useQuery({
    queryKey: ["ticker-fallback", normalizedSymbols],
    queryFn: async () => {
      const ids = normalizedSymbols
        .map((symbol) => symbolMeta.get(symbol)?.coingeckoId)
        .filter(Boolean);

      if (!ids.length) {
        return [] as TickerItem[];
      }

      const response = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${ids.join(",")}&vs_currencies=usd&include_24hr_change=true`,
      );

      if (!response.ok) {
        throw new Error("Failed to fetch fallback prices.");
      }

      const payload = (await response.json()) as Record<
        string,
        { usd?: number; usd_24h_change?: number }
      >;

      return normalizedSymbols.reduce<TickerItem[]>((accumulator, symbol) => {
          const meta = symbolMeta.get(symbol);
          if (!meta) {
            return accumulator;
          }

          const priceData = payload[meta.coingeckoId];
          if (!priceData?.usd) {
            return accumulator;
          }

          accumulator.push({
            symbol,
            label: meta.label,
            price: priceData.usd,
            changePercent: Number(priceData.usd_24h_change ?? 0),
            source: "fallback" as const,
          });

          return accumulator;
        }, []);
    },
    enabled: connectionState !== "connected",
    refetchInterval: connectionState !== "connected" ? 30_000 : false,
    staleTime: 30_000,
  });

  useEffect(() => {
    if (!fallbackQuery.data?.length || connectionState === "connected") {
      return;
    }

    setPrices((current) => {
      const next = { ...current };
      for (const item of fallbackQuery.data) {
        next[item.symbol] = item;
      }
      return next;
    });
  }, [fallbackQuery.data, connectionState]);

  useEffect(() => {
    if (!normalizedSymbols.length) {
      return;
    }

    let disposed = false;
    // AUDIT FIX: No reconnection limit meant the ticker would loop forever on
    // permanent network failure. Cap at 10 attempts, then show disconnected state.
    let retryCount = 0;
    const MAX_RETRIES = 10;

    const connect = (isReconnect: boolean) => {
      if (disposed) {
        return;
      }

      setConnectionState(isReconnect ? "reconnecting" : "connecting");
      const streams = normalizedSymbols
        .map((symbol) => `${symbol.toLowerCase()}@ticker`)
        .join("/");
      const socket = new WebSocket(
        `wss://stream.binance.com:9443/stream?streams=${streams}`,
      );

      websocketRef.current = socket;

      socket.onopen = () => {
        if (disposed) {
          socket.close();
          return;
        }

        setConnectionState("connected");
      };

      socket.onmessage = (event) => {
        const payload = JSON.parse(event.data) as {
          data?: { s?: string; c?: string; P?: string };
        };
        const ticker = payload.data;

        if (!ticker?.s || !ticker.c) {
          return;
        }

        const symbol = String(ticker.s);
        const meta = symbolMeta.get(symbol);
        if (!meta) {
          return;
        }

        setPrices((current) => ({
          ...current,
          [symbol]: {
            symbol,
            label: meta.label,
            price: Number(ticker.c),
            changePercent: Number(ticker.P ?? 0),
            source: "websocket",
          },
        }));
      };

      socket.onerror = () => {
        socket.close();
      };

      socket.onclose = () => {
        if (disposed) {
          return;
        }

        // AUDIT FIX: Enforce the max retry cap before scheduling the next attempt.
        if (retryCount >= MAX_RETRIES) {
          setConnectionState("disconnected");
          return;
        }

        retryCount += 1;
        setConnectionState("reconnecting");
        retryTimeoutRef.current = window.setTimeout(() => connect(true), 5_000);
      };
    };

    connect(false);

    return () => {
      disposed = true;

      if (retryTimeoutRef.current) {
        window.clearTimeout(retryTimeoutRef.current);
      }

      websocketRef.current?.close();
    };
  }, [normalizedSymbols]);

  const orderedItems = normalizedSymbols.map((symbol) => {
    const meta = symbolMeta.get(symbol);
    return (
      prices[symbol] ?? {
        symbol,
        label: meta?.label ?? symbol,
        price: 0,
        changePercent: 0,
        source: "fallback" as const,
      }
    );
  });

  return (
    <div className="sticky top-16 z-20 border-b border-border bg-background/95 backdrop-blur md:top-20">
      {/* flex-nowrap + overflow-x-auto on mobile so nothing is ever clipped;
          on sm+ the cards stretch to fill the full bar width via flex-1 */}
      <div className="flex items-center gap-2 overflow-x-auto px-4 py-2 sm:gap-3 sm:px-6 lg:px-8">
        {orderedItems.map((item) => {
          const positive = item.changePercent >= 0;

          return (
            <div
              key={item.symbol}
              className="flex min-w-[120px] flex-1 items-center justify-between gap-2 rounded-2xl border border-border bg-card px-3 py-2"
            >
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  {item.label}
                </p>
                <p className="mt-1 text-sm font-semibold" data-number="true">
                  {item.price ? `$${formatPrice(item.price)}` : "--"}
                </p>
              </div>
              <div
                className={cn(
                  "flex shrink-0 items-center gap-1 text-sm font-medium",
                  positive
                    ? "text-[color:var(--color-green)]"
                    : "text-[color:var(--color-red)]",
                )}
                data-number="true"
              >
                {positive ? (
                  <ArrowUpRight className="h-4 w-4" />
                ) : (
                  <ArrowDownRight className="h-4 w-4" />
                )}
                {item.changePercent.toFixed(2)}%
              </div>
            </div>
          );
        })}

        {connectionState !== "connected" ? (
          <div className="flex shrink-0 items-center gap-2 rounded-2xl border border-border bg-card px-3 py-2 text-xs text-muted-foreground">
            <WifiOff className="h-3.5 w-3.5" />
            <span>
              {fallbackQuery.isFetching
                ? "Reconnecting… using fallback"
                : "Reconnecting…"}
            </span>
          </div>
        ) : null}
      </div>
    </div>
  );
}
