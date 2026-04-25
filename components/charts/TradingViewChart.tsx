"use client";

import { useQuery } from "@tanstack/react-query";
import {
  CandlestickSeries,
  ColorType,
  LineStyle,
  createChart,
  type CandlestickData,
  type IChartApi,
  type ISeriesApi,
  type Time,
  type UTCTimestamp,
  type WhitespaceData,
} from "lightweight-charts";
import { RefreshCcw } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useMemo, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type CandlestickSeriesApi = ISeriesApi<
  "Candlestick",
  Time,
  CandlestickData<Time> | WhitespaceData<Time>
>;
type PriceLineApi = ReturnType<CandlestickSeriesApi["createPriceLine"]>;

type TradingViewChartProps = {
  symbol: string;
  interval: string;
  height: number;
  levels?: Array<{
    price: number;
    label: string;
    color: string;
  }>;
  className?: string;
};

type BinanceKline = [
  number,
  string,
  string,
  string,
  string,
  string,
  number,
  string,
  number,
  string,
  string,
  string,
];

function getPricePrecision(data: CandlestickData<UTCTimestamp>[]) {
  const sample = data[data.length - 1]?.close ?? data[0]?.close ?? 0;

  if (sample >= 1000) return 2;
  if (sample >= 1) return 3;
  if (sample >= 0.1) return 4;
  if (sample >= 0.01) return 5;
  return 6;
}

const BYBIT_INTERVAL_MAP: Record<string, string> = {
  "15m": "15",
  "1h": "60",
  "4h": "240",
  "1d": "D",
};

async function fetchKlinesFromBybit(symbol: string, interval: string) {
  const bybitInterval = BYBIT_INTERVAL_MAP[interval] ?? "240";
  const response = await fetch(
    `https://api.bybit.com/v5/market/kline?category=spot&symbol=${encodeURIComponent(symbol)}&interval=${bybitInterval}&limit=300`,
  );
  if (!response.ok) throw new Error("Bybit unavailable.");
  const body = (await response.json()) as {
    retCode?: number;
    result?: { list?: string[][] };
  };
  const list = body.result?.list;
  if (!list?.length) throw new Error("No data from Bybit.");
  return list
    .slice()
    .reverse()
    .map((entry) => ({
      time: Math.floor(Number(entry[0]) / 1000) as UTCTimestamp,
      open: Number(entry[1]),
      high: Number(entry[2]),
      low: Number(entry[3]),
      close: Number(entry[4]),
    }));
}

async function fetchKlines(symbol: string, interval: string) {
  const binance = await fetch(
    `https://api.binance.com/api/v3/klines?symbol=${encodeURIComponent(symbol)}&interval=${encodeURIComponent(interval)}&limit=300`,
  ).catch(() => null);

  if (binance?.ok) {
    const payload = (await binance.json()) as BinanceKline[];
    if (payload.length) {
      return payload.map((entry) => ({
        time: Math.floor(entry[0] / 1000) as UTCTimestamp,
        open: Number(entry[1]),
        high: Number(entry[2]),
        low: Number(entry[3]),
        close: Number(entry[4]),
      }));
    }
  }

  return fetchKlinesFromBybit(symbol, interval);
}

export function TradingViewChart({
  symbol,
  interval,
  height,
  levels = [],
  className,
}: TradingViewChartProps) {
  const { resolvedTheme } = useTheme();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<CandlestickSeriesApi | null>(null);
  const priceLinesRef = useRef<PriceLineApi[]>([]);
  const isDark = resolvedTheme === "dark";

  const themeConfig = useMemo(
    () =>
      isDark
        ? {
            background: "#111114",
            text: "#e7e5e4",
            grid: "rgba(255,255,255,0.08)",
            border: "rgba(255,255,255,0.08)",
          }
        : {
            background: "#ffffff",
            text: "#171717",
            grid: "rgba(17,17,20,0.08)",
            border: "rgba(17,17,20,0.08)",
          },
    [isDark],
  );

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["chart-klines", symbol, interval],
    queryFn: () => fetchKlines(symbol, interval),
    staleTime: 60_000,
    gcTime: 5 * 60_000,
    retry: 1,
  });

  useEffect(() => {
    if (!containerRef.current || chartRef.current) {
      return;
    }

    const chart = createChart(containerRef.current, {
      width: containerRef.current.clientWidth || 600,
      height,
      layout: {
        background: { type: ColorType.Solid, color: themeConfig.background },
        textColor: themeConfig.text,
      },
      grid: {
        vertLines: { color: themeConfig.grid },
        horzLines: { color: themeConfig.grid },
      },
      rightPriceScale: {
        borderColor: themeConfig.border,
      },
      timeScale: {
        borderColor: themeConfig.border,
        timeVisible: true,
      },
      crosshair: {
        vertLine: {
          color: themeConfig.border,
          labelBackgroundColor: themeConfig.background,
        },
        horzLine: {
          color: themeConfig.border,
          labelBackgroundColor: themeConfig.background,
        },
      },
      handleScroll: {
        mouseWheel: true,
        pressedMouseMove: true,
        horzTouchDrag: true,
        vertTouchDrag: false,
      },
      handleScale: {
        pinch: true,
        mouseWheel: true,
      },
    });

    const series = chart.addSeries(CandlestickSeries, {
      upColor: "#2d6a0f",
      downColor: "#8b2020",
      wickUpColor: "#2d6a0f",
      wickDownColor: "#8b2020",
      borderUpColor: "#2d6a0f",
      borderDownColor: "#8b2020",
      lastValueVisible: true,
      priceLineVisible: false,
    });

    chartRef.current = chart;
    seriesRef.current = series;

    const resizeObserver = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width ?? containerRef.current?.clientWidth ?? 0;
      if (width > 0) {
        chart.applyOptions({ width });
      }
    });

    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
      priceLinesRef.current = [];
      seriesRef.current = null;
      chart.remove();
      chartRef.current = null;
    };
  }, [height, themeConfig.background, themeConfig.border, themeConfig.grid, themeConfig.text]);

  useEffect(() => {
    if (!chartRef.current || !seriesRef.current) {
      return;
    }

    chartRef.current.applyOptions({
      height,
      layout: {
        background: { type: ColorType.Solid, color: themeConfig.background },
        textColor: themeConfig.text,
      },
      grid: {
        vertLines: { color: themeConfig.grid },
        horzLines: { color: themeConfig.grid },
      },
      rightPriceScale: {
        borderColor: themeConfig.border,
      },
      timeScale: {
        borderColor: themeConfig.border,
      },
      crosshair: {
        vertLine: {
          color: themeConfig.border,
          labelBackgroundColor: themeConfig.background,
        },
        horzLine: {
          color: themeConfig.border,
          labelBackgroundColor: themeConfig.background,
        },
      },
    });
  }, [height, themeConfig]);

  useEffect(() => {
    if (!seriesRef.current || !data?.length) {
      return;
    }

    const precision = getPricePrecision(data);

    seriesRef.current.applyOptions({
      priceFormat: {
        type: "price",
        precision,
        minMove: Number((1 / 10 ** precision).toFixed(precision)),
      },
    });
    seriesRef.current.setData(data);
    chartRef.current?.timeScale().fitContent();
  }, [data]);

  useEffect(() => {
    if (!seriesRef.current) {
      return;
    }

    for (const line of priceLinesRef.current) {
      seriesRef.current.removePriceLine(line);
    }
    priceLinesRef.current = [];

    for (const level of levels) {
      const line = seriesRef.current.createPriceLine({
        price: level.price,
        color: level.color,
        lineWidth: 2,
        lineStyle: LineStyle.Dashed,
        axisLabelVisible: true,
        title: level.label,
      });
      priceLinesRef.current.push(line);
    }
  }, [levels]);

  if (isLoading) {
    return <Skeleton className={cn("w-full rounded-3xl", className)} style={{ height }} />;
  }

  if (isError) {
    return (
      <div
        className={cn(
          "flex h-full min-h-[220px] flex-col items-center justify-center gap-3 rounded-3xl border border-border bg-muted/20 px-6 text-center",
          className,
        )}
        style={{ height }}
      >
        <p className="text-sm font-medium text-foreground">Chart data unavailable</p>
        <p className="max-w-sm text-sm text-muted-foreground">
          Binance did not return OHLC data for {symbol} on the {interval.toUpperCase()} timeframe.
        </p>
        <Button type="button" variant="outline" onClick={() => void refetch()}>
          <RefreshCcw className="mr-2 h-4 w-4" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className={cn("relative", className)}>
      {isFetching ? (
        <div className="pointer-events-none absolute right-3 top-3 z-10 rounded-full bg-background/90 px-3 py-1 text-xs text-muted-foreground shadow-sm">
          Refreshing…
        </div>
      ) : null}
      <div ref={containerRef} className="w-full overflow-hidden rounded-3xl" style={{ height }} />
    </div>
  );
}
