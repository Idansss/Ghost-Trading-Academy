import type { DailyOutlook } from "@prisma/client";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AvoidList } from "@/components/outlook/AvoidList";
import { CoinWatchItem } from "@/components/outlook/CoinWatchItem";

export function OutlookCard({
  outlook,
}: {
  outlook: DailyOutlook & {
    coinsToWatch: Array<{ coin: string; note: string }>;
    levels: Array<{ coin: string; resistance: string; support: string }>;
    avoidToday: string[];
  };
}) {
  const badgeVariant =
    outlook.marketBias === "BULLISH"
      ? "success"
      : outlook.marketBias === "BEARISH"
        ? "danger"
        : outlook.marketBias === "RANGING"
          ? "warning"
          : "muted";

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-primary">
                {format(new Date(outlook.date), "EEEE")}
              </p>
              <CardTitle className="mt-2 text-2xl">
                {format(new Date(outlook.date), "MMMM d, yyyy")}
              </CardTitle>
            </div>
            <Badge variant={badgeVariant}>
              <span className="status-dot bg-current" />
              {outlook.marketBias}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div
            className={`rounded-2xl border-l-4 p-4 text-sm text-muted-foreground ${
              outlook.marketBias === "BULLISH"
                ? "border-[color:var(--color-green)] bg-[color:var(--color-green-light)]"
                : outlook.marketBias === "BEARISH"
                  ? "border-[color:var(--color-red)] bg-[color:var(--color-red-light)]"
                  : outlook.marketBias === "RANGING"
                    ? "border-amber-500 bg-amber-500/10"
                    : "border-border bg-muted/50"
            }`}
          >
            {outlook.biasExplanation}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Coins To Watch</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {outlook.coinsToWatch.map((item) => (
              <CoinWatchItem key={item.coin} {...item} />
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Key Levels</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
            <div className="min-w-max px-6 pb-6">
            <Table className="min-w-[360px] w-full">
              <TableHeader>
                <TableRow>
                  <TableHead>Coin</TableHead>
                  <TableHead>Resistance</TableHead>
                  <TableHead>Support</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {outlook.levels.map((level) => (
                  <TableRow key={level.coin}>
                    <TableCell>{level.coin}</TableCell>
                    <TableCell>{level.resistance}</TableCell>
                    <TableCell>{level.support}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>What To Avoid Today</CardTitle>
        </CardHeader>
        <CardContent>
          <AvoidList items={outlook.avoidToday} />
        </CardContent>
      </Card>
    </div>
  );
}
