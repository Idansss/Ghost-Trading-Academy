"use client";

import { useMemo, useState } from "react";
import { TradingViewChart } from "@/components/charts/TradingViewChart";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CHART_INTERVAL_OPTIONS,
  normalizeChartSymbol,
  parseChartPrice,
  type ChartInterval,
} from "@/lib/chart-utils";

export function OutlookChartCard({
  coin,
  note,
  resistance,
  support,
}: {
  coin: string;
  note: string;
  resistance?: string;
  support?: string;
}) {
  const [interval, setInterval] = useState<ChartInterval>("4h");

  const levels = useMemo(
    () =>
      [
        {
          price: parseChartPrice(resistance),
          label: "Resistance",
          color: "#8b2020",
        },
        {
          price: parseChartPrice(support),
          label: "Support",
          color: "#2d6a0f",
        },
      ].filter((level): level is { price: number; label: string; color: string } => level.price !== null),
    [resistance, support],
  );

  return (
    <Card>
      <CardHeader className="space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <CardTitle>{coin}</CardTitle>
              <Badge variant="info">{normalizeChartSymbol(coin)}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">{note}</p>
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
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <TradingViewChart
          symbol={normalizeChartSymbol(coin)}
          interval={interval}
          height={340}
          levels={levels}
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-border p-4">
            <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Resistance</p>
            <p className="mt-2 text-sm font-medium text-foreground">{resistance ?? "N/A"}</p>
          </div>
          <div className="rounded-2xl border border-border p-4">
            <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Support</p>
            <p className="mt-2 text-sm font-medium text-foreground">{support ?? "N/A"}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
