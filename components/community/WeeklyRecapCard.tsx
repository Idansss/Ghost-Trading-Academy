import type { WeeklyRecap } from "@prisma/client";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricCard } from "@/components/shared/MetricCard";
import { formatPercent } from "@/lib/utils";

export function WeeklyRecapCard({ recap }: { recap: WeeklyRecap | null }) {
  if (!recap) {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-muted-foreground">
          No weekly recap has been published yet.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Weekly Recap: {format(new Date(recap.weekStartDate), "MMM d")} -{" "}
          {format(new Date(recap.weekEndDate), "MMM d")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <MetricCard label="Total Trades" value={`${recap.totalTrades}`} />
          <MetricCard label="Win Rate" value={`${recap.winRate.toFixed(1)}%`} />
          <MetricCard label="Best Trade" value={recap.bestTrade} tone="positive" />
          <MetricCard label="Worst Trade" value={recap.worstTrade} tone="negative" />
        </div>
        <div className="space-y-3 text-sm">
          <div>
            <p className="font-medium">Total P&L</p>
            <p className="text-muted-foreground">{formatPercent(recap.totalPnlPercent)}</p>
          </div>
          <div>
            <p className="font-medium">What We Learned</p>
            <p className="text-muted-foreground">{recap.whatWeLearned}</p>
          </div>
          <div>
            <p className="font-medium">Next Week Focus</p>
            <p className="text-muted-foreground">{recap.nextWeekFocus}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
