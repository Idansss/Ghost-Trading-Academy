import Link from "next/link";
import type { MarketBias, TradeOutcome } from "@prisma/client";
import { ArrowRight, Compass, ShieldAlert, Sparkles, Target } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPercent } from "@/lib/utils";

const biasVariantMap: Record<
  MarketBias,
  "default" | "success" | "danger" | "warning" | "muted"
> = {
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
  bestSetup: { setup: string; winRate: number; count: number; tagContext: string | null };
  weakestWeekday: { label: string; winRate: number; totalTrades: number } | null;
  latestTrade: { outcome: TradeOutcome } | null;
  focusItems: string[];
}) {
  return (
    <div className="space-y-4">
      <Card className="premium-ring">
        <CardHeader className="flex flex-row items-start justify-between gap-3 pb-3">
          <div>
            <CardTitle>Today&apos;s Trade Plan</CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">
              A tighter execution brief built from your journal and the desk bias.
            </p>
          </div>
          <Badge variant={latestOutlook ? biasVariantMap[latestOutlook.marketBias] : "muted"}>
            <Compass className="mr-1.5 h-3 w-3" />
            {latestOutlook?.marketBias ?? "WAITING"}
          </Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 divide-x divide-border overflow-hidden rounded-xl border border-border bg-background/40">
            <div className="px-4 py-3">
              <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                Active Setups
              </p>
              <p className="mt-1.5 text-[2rem] font-semibold leading-none" data-number="true">
                {activeSignals}
              </p>
              <p className="mt-1 text-[11px] text-muted-foreground">Live desk ideas</p>
            </div>
            <div className="px-4 py-3">
              <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                Best Setup
              </p>
              <p className="mt-1.5 truncate text-lg font-semibold">
                {bestSetup.setup || "--"}
              </p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                {bestSetup.count
                  ? `${bestSetup.count} trades | ${bestSetup.winRate.toFixed(1)}% WR`
                  : "Log more trades"}
              </p>
            </div>
            <div className="px-4 py-3">
              <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                Caution Zone
              </p>
              <p className="mt-1.5 truncate text-lg font-semibold">
                {weakestWeekday?.label ?? "--"}
              </p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                {weakestWeekday
                  ? `${formatPercent(weakestWeekday.winRate, 1)} WR | ${weakestWeekday.totalTrades} trades`
                  : "No pattern yet"}
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-primary/20 bg-primary/10 p-3.5">
            <div className="flex items-start gap-2.5">
              <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <div className="space-y-1">
                <p className="text-[13px] font-medium">Execution notes</p>
                <p className="text-[13px] text-muted-foreground">
                  {latestOutlook?.biasExplanation ??
                    "Publish a daily outlook to turn this panel into a clear pre-session plan."}
                </p>
                {latestTrade ? (
                  <p className="text-[13px] text-muted-foreground">
                    {outcomeCopy[latestTrade.outcome]}
                  </p>
                ) : (
                  <p className="text-[13px] text-muted-foreground">
                    Log a few trades to unlock personalised execution feedback.
                  </p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Focus Checklist</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2.5">
            {focusItems.map((item) => (
              <div
                key={item}
                className="flex items-start gap-2.5 rounded-lg border border-border px-3.5 py-2.5"
              >
                <Target className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <p className="text-[13px] text-muted-foreground">{item}</p>
              </div>
            ))}
            <div className="flex items-start gap-2.5 rounded-lg border border-dashed border-border px-3.5 py-2.5">
              <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--color-red)]" />
              <p className="text-[13px] text-muted-foreground">
                Review invalidation levels before entry. Great traders lose small before they win big.
              </p>
            </div>
          </div>
          <Link
            href="/journal"
            className="mt-3 inline-flex items-center text-[13px] font-medium text-primary transition hover:underline"
          >
            Review journal patterns
            <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
