import type { Signal } from "@prisma/client";
import { ArrowUpRight, ArrowDownRight, Lightbulb } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function SignalCard({ signal }: { signal: Signal }) {
  const bullish = signal.direction === "LONG";

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
        <div className="flex items-center gap-4">
          <div
            className={`grid h-12 w-12 place-items-center rounded-full ${
              bullish
                ? "bg-[color:var(--color-green-light)] text-[color:var(--color-green)]"
                : "bg-[color:var(--color-red-light)] text-[color:var(--color-red)]"
            }`}
          >
            {bullish ? <ArrowUpRight className="h-5 w-5" /> : <ArrowDownRight className="h-5 w-5" />}
          </div>
          <div>
            <CardTitle className="text-xl">{signal.coin}</CardTitle>
            <div className="mt-2 flex flex-wrap gap-2">
              <Badge variant={bullish ? "success" : "danger"}>
                <span className="status-dot bg-current" />
                {signal.direction}
              </Badge>
              <Badge variant="muted">
                <span className="status-dot bg-current" />
                {signal.status}
              </Badge>
              <Badge variant="info">{signal.timeframe}</Badge>
            </div>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          {formatDistanceToNow(new Date(signal.postedAt), { addSuffix: true })}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-6">
          {[
            ["Entry Zone", signal.entryZone],
            ["Stop Loss", signal.stopLoss],
            ["TP1", signal.tp1],
            ["TP2", signal.tp2],
            ["TP3", signal.tp3],
            ["R:R", `${signal.rrRatio.toFixed(2)}R`],
          ].map(([label, value]) => (
            <div key={label} className="rounded-2xl border border-border p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
                {label}
              </p>
              <p className="mt-2 text-sm font-medium">{value}</p>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-primary/20 bg-primary/10 p-4">
          <div className="flex items-start gap-3">
            <Lightbulb className="mt-0.5 h-4 w-4 text-primary" />
            <p className="text-sm text-muted-foreground">{signal.reasoning}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge variant="warning">{signal.riskLevel} Risk</Badge>
          <Badge variant="info">{signal.timeframe}</Badge>
        </div>
      </CardContent>
    </Card>
  );
}
