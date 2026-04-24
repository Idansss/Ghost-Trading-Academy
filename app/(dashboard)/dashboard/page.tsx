import Link from "next/link";
import { DecisionSupportCards } from "@/components/dashboard/DecisionSupportCards";
import { EquityChart } from "@/components/dashboard/EquityChart";
import { MonthlyPnlChart } from "@/components/dashboard/MonthlyPnlChart";
import { OnboardingChecklist } from "@/components/dashboard/OnboardingChecklist";
import { OnboardingResumeBanner } from "@/components/dashboard/OnboardingResumeBanner";
import { RecentTradesTable } from "@/components/dashboard/RecentTradesTable";
import { StatsGrid } from "@/components/dashboard/StatsGrid";
import { StreakCard } from "@/components/dashboard/StreakCard";
import { WatchlistWidget } from "@/components/dashboard/WatchlistWidget";
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
    <div className="space-y-5">
      <PageHeader
        eyebrow="Overview"
        title="Trading Command Center"
        description="Track performance, lock onto the current bias, and turn your journal into sharper execution."
      />

      <OnboardingResumeBanner
        completed={data.onboarding.completed}
        completedCount={data.onboarding.completedCount}
        totalSteps={data.onboarding.totalSteps}
        progressPercent={data.onboarding.progressPercent}
        nextStepTitle={data.onboarding.nextStep?.title ?? null}
      />
      <OnboardingChecklist {...data.onboarding} />
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(18rem,0.9fr)]">
        <div className="min-w-0 space-y-5">
          <StatsGrid {...data.kpis} />
          <DecisionSupportCards
            latestOutlook={data.latestOutlook}
            activeSignals={data.activeSignals}
            bestSetup={data.bestSetup}
            weakestWeekday={data.weakestWeekday}
            latestTrade={data.latestTrade}
            focusItems={data.focusItems}
          />
        </div>

        <div className="min-w-0">
          <StreakCard {...data.streak} />
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.55fr)_minmax(18rem,1fr)]">
        <div className="min-w-0 space-y-5">
          <EquityChart data={data.equityCurve} />
          <RecentTradesTable trades={data.recentTrades} />
        </div>

        <div className="min-w-0 space-y-5">
          <MonthlyPnlChart data={monthlyBars} />

          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Today&apos;s Market Bias</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5">
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
                  <p className="text-xs text-muted-foreground">
                    {data.latestOutlook.biasExplanation}
                  </p>
                </>
              ) : (
                <p className="text-xs text-muted-foreground">
                  No market outlook has been posted yet.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Active Signals</CardTitle>
            </CardHeader>
            <CardContent className="flex items-end justify-between gap-2.5">
              <div>
                <p className="text-[2rem] font-semibold leading-none" data-number="true">
                  {data.activeSignals}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
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
          <WatchlistWidget />

          {data.pinnedFocus ? (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle>Weekly Focus Reminder</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">{data.pinnedFocus}</p>
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}
