import { ArrowLeft, ArrowDownRight, ArrowUpRight, CheckCircle2, Lightbulb } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SignalChartPanel } from "@/components/charts/SignalChartPanel";
import { SignalPositionSizingSheet } from "@/components/signals/SignalPositionSizingSheet";
import { SignalViewedTracker } from "@/components/signals/SignalViewedTracker";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSignalStatusVariant } from "@/lib/signal-performance";

export default async function SignalDetailPage({
  params,
}: {
  params: { id: string };
}) {
  await requireUser();

  const signal = await prisma.signal.findUnique({
    where: { id: params.id },
  });

  if (!signal) {
    notFound();
  }

  const bullish = signal.direction === "LONG";
  const milestones = [
    { label: "TP1", hit: signal.tp1Hit, value: signal.tp1 },
    { label: "TP2", hit: signal.tp2Hit, value: signal.tp2 },
    { label: "TP3", hit: signal.tp3Hit, value: signal.tp3 },
    { label: "Stop Loss", hit: signal.stopHit, value: signal.stopLoss },
  ];

  return (
    <div className="space-y-6">
      <SignalViewedTracker signalId={signal.id} />
      <Button asChild variant="ghost" className="w-fit px-0 text-muted-foreground">
        <Link href="/signals">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to signals
        </Link>
      </Button>

      <Card>
        <CardHeader className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="flex items-center gap-4">
            <div
              className={`grid h-14 w-14 place-items-center rounded-full ${
                bullish
                  ? "bg-[color:var(--color-green-light)] text-[color:var(--color-green)]"
                  : "bg-[color:var(--color-red-light)] text-[color:var(--color-red)]"
              }`}
            >
              {bullish ? <ArrowUpRight className="h-6 w-6" /> : <ArrowDownRight className="h-6 w-6" />}
            </div>
            <div className="space-y-2">
              <CardTitle className="text-3xl">{signal.coin}</CardTitle>
              <div className="flex flex-wrap gap-2">
                <Badge variant={bullish ? "success" : "danger"}>{signal.direction}</Badge>
                <Badge variant={getSignalStatusVariant(signal.status)}>{signal.status}</Badge>
                <Badge variant="info">{signal.timeframe}</Badge>
                <Badge variant="warning">{signal.riskLevel} Risk</Badge>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
            <p>Posted {new Date(signal.postedAt).toLocaleString()}</p>
            {signal.closedAt ? <p>Closed {new Date(signal.closedAt).toLocaleString()}</p> : null}
            <div className="mt-3">
              <SignalPositionSizingSheet
                entryZone={signal.entryZone}
                stopLoss={signal.stopLoss}
                tp1={signal.tp1}
                tp2={signal.tp2}
                tp3={signal.tp3}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
            {[ 
              ["Entry Zone", signal.entryZone],
              ["Stop Loss", signal.stopLoss],
              ["TP1", signal.tp1],
              ["TP2", signal.tp2],
              ["TP3", signal.tp3],
              ["R:R", `${signal.rrRatio.toFixed(2)}R`],
              ["Final Result", signal.finalPnlR !== null ? `${signal.finalPnlR.toFixed(2)}R` : "Open"],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl border border-border p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
                  {label}
                </p>
                <p className="mt-2 text-base font-semibold text-foreground">{value}</p>
              </div>
            ))}
          </div>

          <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
            <div className="rounded-3xl border border-primary/20 bg-primary/10 p-5">
              <div className="flex items-start gap-3">
                <Lightbulb className="mt-0.5 h-4 w-4 text-primary" />
                <div className="space-y-3">
                  <p className="text-sm font-medium text-foreground">Desk reasoning</p>
                  <p className="text-sm leading-6 text-muted-foreground">{signal.reasoning}</p>
                  {signal.outcomeNote ? (
                    <div className="rounded-2xl border border-primary/20 bg-background/80 px-4 py-3">
                      <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
                        Outcome note
                      </p>
                      <p className="mt-2 text-sm text-foreground">{signal.outcomeNote}</p>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-border p-5">
              <p className="text-sm font-medium text-foreground">Outcome tracker</p>
              <div className="mt-4 space-y-3">
                {milestones.map((milestone) => (
                  <div
                    key={milestone.label}
                    className="flex items-center justify-between rounded-2xl border border-border px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-medium">{milestone.label}</p>
                      <p className="text-xs text-muted-foreground">{milestone.value}</p>
                    </div>
                    <Badge variant={milestone.hit ? "success" : "muted"}>
                      {milestone.hit ? <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> : null}
                      {milestone.hit ? "Hit" : "Pending"}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <SignalChartPanel
        coin={signal.coin}
        timeframe={signal.timeframe}
        entryZone={signal.entryZone}
        stopLoss={signal.stopLoss}
        tp1={signal.tp1}
        tp2={signal.tp2}
        tp3={signal.tp3}
      />
    </div>
  );
}
