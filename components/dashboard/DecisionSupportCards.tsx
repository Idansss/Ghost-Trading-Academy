import Link from "next/link";
import type { MarketBias, TradeOutcome } from "@prisma/client";
import { ArrowRight, Compass, ShieldAlert, Sparkles, Target } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPercent } from "@/lib/utils";

const biasVariantMap: Record<MarketBias, "default" | "success" | "danger" | "warning" | "muted"> = {
  BULLISH: "success",
  BEARISH: "danger",
  NEUTRAL: "muted",
  RANGING: "warning",
};

const outcomeCopy: Record<TradeOutcome, string> = {
  WIN: "Recent execution is working. Stay selective and avoid forcing lower-quality entries.",
  LOSS: "Your latest trade closed red. Tighten confirmation rules before taking the next setup.",
  BREAKEVEN: "You protected capital on the last trade. Keep the same discipline on invalidations.",
  PENDING: "You have an open trade outcome pending. Avoid stacking correlated risk.",
  CANCELLED: "The last trade was cancelled. Review whether the invalidation was respected early enough.",
};

export function DecisionSupportCards({
  latestOutlook,
  activeSignals,
  bestSetup,
  weakestWeekday,
  latestTrade,
  focusItems,
}: {
  latestOutlook: { marketBias: MarketBias; biasExplanation: string } | null;
  activeSignals: number;
  bestSetup: { setup: string; winRate: number; count: number };
  weakestWeekday: { label: string; winRate: number; totalTrades: number } | null;
  latestTrade: { outcome: TradeOutcome } | null;
  focusItems: string[];
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-[1.25fr_0.95fr]">
      <Card className="premium-ring">
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle>Today&apos;s Trade Plan</CardTitle>
            <p className="mt-2 text-sm text-muted-foreground">
              A tighter execution brief built from your journal and the desk bias.
            </p>
          </div>
          <Badge variant={latestOutlook ? biasVariantMap[latestOutlook.marketBias] : "muted"}>
            <Compass className="mr-2 h-3.5 w-3.5" />
            {latestOutlook?.marketBias ?? "WAITING"}
          </Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-border p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
                Active Setups
              </p>
              <p className="mt-2 text-2xl font-semibold">{activeSignals}</p>
              <p className="mt-1 text-sm text-muted-foreground">Desk ideas worth monitoring.</p>
            </div>
            <div className="rounded-2xl border border-border p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
                Best Setup
              </p>
              <p className="mt-2 text-lg font-semibold">
                {bestSetup.setup || "Not enough data"}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {bestSetup.count
                  ? `${bestSetup.count} trades at ${bestSetup.winRate.toFixed(1)}% win rate.`
                  : "Journal more trades to identify your edge."}
              </p>
            </div>
            <div className="rounded-2xl border border-border p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
                Caution Zone
              </p>
              <p className="mt-2 text-lg font-semibold">
                {weakestWeekday?.label ?? "No pattern yet"}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {weakestWeekday
                  ? `${formatPercent(weakestWeekday.winRate, 1)} win rate across ${weakestWeekday.totalTrades} trades.`
                  : "No statistically weak weekday has emerged yet."}
              </p>
            </div>
          </div>

          <div className="rounded-3xl border border-primary/20 bg-primary/10 p-5">
            <div className="flex items-start gap-3">
              <Sparkles className="mt-0.5 h-5 w-5 text-primary" />
              <div className="space-y-2">
                <p className="font-medium">Execution notes</p>
                <p className="text-sm text-muted-foreground">
                  {latestOutlook?.biasExplanation ??
                    "Publish a daily outlook to turn this panel into a clear pre-session plan."}
                </p>
                <p className="text-sm text-muted-foreground">
                  {latestTrade ? outcomeCopy[latestTrade.outcome] : "Log a few trades to unlock personalized execution feedback."}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Focus Checklist</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {focusItems.map((item) => (
            <div key={item} className="flex items-start gap-3 rounded-2xl border border-border p-4">
              <Target className="mt-0.5 h-4 w-4 text-primary" />
              <p className="text-sm text-muted-foreground">{item}</p>
            </div>
          ))}

          <div className="rounded-2xl border border-dashed border-border p-4">
            <div className="flex items-start gap-3">
              <ShieldAlert className="mt-0.5 h-4 w-4 text-[color:var(--color-red)]" />
              <p className="text-sm text-muted-foreground">
                Review invalidation levels before entry. Great traders lose small before they win big.
              </p>
            </div>
          </div>

          <Link
            href="/journal"
            className="inline-flex items-center text-sm font-medium text-primary transition hover:underline"
          >
            Review journal patterns
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
