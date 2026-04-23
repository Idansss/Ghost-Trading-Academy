import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SignalTrackRecordChart } from "@/components/signals/SignalTrackRecordChart";
import { PageHeader } from "@/components/shared/PageHeader";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getSignalOutcomeLabel, getSignalStatusVariant } from "@/lib/signal-performance";
import { getSignalTrackRecord } from "@/server/repositories/signal-repository";

function TrackRecordTabs({ value }: { value: "30d" | "90d" | "all" }) {
  return (
    <Tabs value={value}>
      <TabsList>
        <TabsTrigger value="30d" asChild>
          <Link href="/signals/track-record?range=30d">Last 30 days</Link>
        </TabsTrigger>
        <TabsTrigger value="90d" asChild>
          <Link href="/signals/track-record?range=90d">Last 90 days</Link>
        </TabsTrigger>
        <TabsTrigger value="all" asChild>
          <Link href="/signals/track-record?range=all">All time</Link>
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}

export default async function SignalTrackRecordPage({
  searchParams,
}: {
  searchParams?: { range?: string };
}) {
  const range = searchParams?.range === "30d" || searchParams?.range === "90d" ? searchParams.range : "all";
  const data = await getSignalTrackRecord(range);

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-6 px-4 py-10 sm:px-6 lg:px-8">
      <PageHeader
        eyebrow="Track Record"
        title="Desk Signal History"
        description="A transparent record of closed setups, outcome quality, and cumulative performance in R multiples."
        action={
          <div className="flex flex-wrap gap-3">
            <TrackRecordTabs value={range} />
            <Button asChild variant="outline">
              <Link href="/auth/login">Access the desk</Link>
            </Button>
          </div>
        }
      />

      <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Signals</CardTitle></CardHeader><CardContent><p className="text-3xl font-semibold">{data.stats.totalSignals}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Win Rate</CardTitle></CardHeader><CardContent><p className="text-3xl font-semibold">{data.stats.winRate.toFixed(1)}%</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Full TP3 Rate</CardTitle></CardHeader><CardContent><p className="text-3xl font-semibold">{data.stats.fullTp3Rate.toFixed(1)}%</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Avg R</CardTitle></CardHeader><CardContent><p className="text-3xl font-semibold">{data.stats.avgR.toFixed(2)}R</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Win Streak</CardTitle></CardHeader><CardContent><p className="text-3xl font-semibold">{data.stats.winStreak}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Loss Streak</CardTitle></CardHeader><CardContent><p className="text-3xl font-semibold">{data.stats.lossStreak}</p></CardContent></Card>
      </div>

      <SignalTrackRecordChart data={data.equityCurve} />

      <Card>
        <CardHeader>
          <CardTitle>Closed Signals</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <div className="min-w-[760px] space-y-3">
            <div className="grid grid-cols-[1.2fr_0.9fr_0.9fr_0.9fr_0.9fr] gap-4 px-4 text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              <span>Pair</span>
              <span>Outcome</span>
              <span>Status</span>
              <span>Result</span>
              <span>Date</span>
            </div>
            {data.signals.map((signal) => (
              <div key={signal.id} className="grid grid-cols-[1.2fr_0.9fr_0.9fr_0.9fr_0.9fr] gap-4 rounded-2xl border border-border px-4 py-4 text-sm">
                <div>
                  <p className="font-medium">{signal.coin}</p>
                  <p className="text-xs text-muted-foreground">{signal.direction}</p>
                </div>
                <div>{getSignalOutcomeLabel(signal)}</div>
                <div>
                  <Badge variant={getSignalStatusVariant(signal.status)}>{signal.status}</Badge>
                </div>
                <div className={signal.finalPnlR && signal.finalPnlR < 0 ? "text-[color:var(--color-red)]" : signal.finalPnlR && signal.finalPnlR > 0 ? "text-[color:var(--color-green)]" : ""}>
                  {signal.finalPnlR !== null ? `${signal.finalPnlR.toFixed(2)}R` : "N/A"}
                </div>
                <div>{new Date(signal.closedAt ?? signal.postedAt).toLocaleDateString()}</div>
              </div>
            ))}
            {data.signals.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
                No closed signals yet for this timeframe.
              </div>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
