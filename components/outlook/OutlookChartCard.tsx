"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChartSkeleton } from "@/components/charts/ChartSkeleton";
import {
  CHART_INTERVAL_OPTIONS,
  normalizeChartSymbol,
  type ChartInterval,
} from "@/lib/chart-utils";

const TradingViewAdvancedWidget = dynamic(
  () =>
    import("@/components/charts/TradingViewAdvancedWidget").then(
      (m) => m.TradingViewAdvancedWidget,
    ),
  { ssr: false, loading: () => <ChartSkeleton height={400} /> },
);

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

  return (
    <Card>
      <CardHeader className="space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
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
        <TradingViewAdvancedWidget
          symbol={normalizeChartSymbol(coin)}
          interval={interval}
          height={400}
          allowSymbolChange={false}
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
