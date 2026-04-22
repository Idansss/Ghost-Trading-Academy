import Link from "next/link";
import { DecisionSupportCards } from "@/components/dashboard/DecisionSupportCards";
import { EquityChart } from "@/components/dashboard/EquityChart";
import { MonthlyPnlChart } from "@/components/dashboard/MonthlyPnlChart";
import { OnboardingChecklist } from "@/components/dashboard/OnboardingChecklist";
import { RecentTradesTable } from "@/components/dashboard/RecentTradesTable";
import { StatsGrid } from "@/components/dashboard/StatsGrid";
import { PageHeader } from "@/components/shared/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireUser } from "@/lib/auth";
import { getDashboardData } from "@/lib/dashboard";

export default async function DashboardPage() {
  const user = await requireUser();
  const data = await getDashboardData(user.id, user.accountBalance);
  const monthlyBars = Object.entries(data.monthlySnapshot).map(([month, pnl]) => ({
    month,
    pnl,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Overview"
        title="Trading Command Center"
        description="Track performance, lock onto the current bias, and turn your journal into sharper execution."
      />

      <OnboardingChecklist {...data.onboarding} />
      <StatsGrid {...data.kpis} />
      <DecisionSupportCards
        latestOutlook={data.latestOutlook}
        activeSignals={data.activeSignals}
        bestSetup={data.bestSetup}
        weakestWeekday={data.weakestWeekday}
        latestTrade={data.latestTrade}
        focusItems={data.focusItems}
      />

      <div className="grid gap-6 xl:grid-cols-[1.65fr_1fr]">
        <div className="space-y-6">
          <EquityChart data={data.equityCurve} />
          <RecentTradesTable trades={data.recentTrades} />
        </div>

        <div className="space-y-6">
          <MonthlyPnlChart data={monthlyBars} />

          <Card>
            <CardHeader>
              <CardTitle>Today&apos;s Market Bias</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.latestOutlook ? (
                <>
                  <Badge
                    variant={
                      data.latestOutlook.marketBias === "BULLISH"
                        ? "success"
                        : data.latestOutlook.marketBias === "BEARISH"
                          ? "danger"
                          : data.latestOutlook.marketBias === "RANGING"
                            ? "warning"
                            : "muted"
                    }
                  >
                    <span className="status-dot bg-current" />
                    {data.latestOutlook.marketBias}
                  </Badge>
                  <p className="text-sm text-muted-foreground">
                    {data.latestOutlook.biasExplanation}
                  </p>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No market outlook has been posted yet.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Active Signals</CardTitle>
            </CardHeader>
            <CardContent className="flex items-end justify-between gap-3">
              <div>
                <p className="text-3xl font-semibold">{data.activeSignals}</p>
                <p className="text-sm text-muted-foreground">
                  Live or pending setups on the desk.
                </p>
              </div>
              <Link
                href="/signals"
                className="text-sm font-medium text-primary hover:underline"
              >
                View signals &rarr;
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
