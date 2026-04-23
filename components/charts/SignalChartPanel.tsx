"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CHART_INTERVAL_OPTIONS,
  inferChartInterval,
  normalizeChartSymbol,
  parseChartPrice,
  parseEntryZonePrice,
  type ChartInterval,
} from "@/lib/chart-utils";
import { TradingViewChart } from "@/components/charts/TradingViewChart";

export function SignalChartPanel({
  coin,
  timeframe,
  entryZone,
  stopLoss,
  tp1,
  tp2,
  tp3,
}: {
  coin: string;
  timeframe?: string;
  entryZone: string;
  stopLoss: string;
  tp1: string;
  tp2: string;
  tp3: string;
}) {
  const [interval, setInterval] = useState<ChartInterval>(inferChartInterval(timeframe));

  const levels = useMemo(
    () =>
      [
        {
          price: parseEntryZonePrice(entryZone),
          label: "Entry",
          color: "#b8860b",
        },
        {
          price: parseChartPrice(stopLoss),
          label: "Stop",
          color: "#8b2020",
        },
        {
          price: parseChartPrice(tp1),
          label: "TP1",
          color: "#2d6a0f",
        },
        {
          price: parseChartPrice(tp2),
          label: "TP2",
          color: "#0e4f8a",
        },
        {
          price: parseChartPrice(tp3),
          label: "TP3",
          color: "#6b7280",
        },
      ]
        .filter((level): level is { price: number; label: string; color: string } => level.price !== null),
    [entryZone, stopLoss, tp1, tp2, tp3],
  );

  return (
    <Card>
      <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <CardTitle>Price Structure</CardTitle>
          <p className="mt-2 text-sm text-muted-foreground">
            Binance OHLC data with the desk&apos;s entry, stop, and target levels layered directly on the chart.
          </p>
        </div>
        <Tabs value={interval} onValueChange={(value) => setInterval(value as ChartInterval)}>
          <TabsList>
            {CHART_INTERVAL_OPTIONS.map((option) => (
              <TabsTrigger key={option.value} value={option.value}>
                {option.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent>
        <TradingViewChart
          symbol={normalizeChartSymbol(coin)}
          interval={interval}
          height={420}
          levels={levels}
        />
      </CardContent>
    </Card>
  );
}
