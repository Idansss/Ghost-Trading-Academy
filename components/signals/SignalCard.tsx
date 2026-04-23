"use client";

import type { Signal } from "@prisma/client";
import { ArrowUpRight, ArrowDownRight, CheckCircle2, Circle, Lightbulb } from "lucide-react";
import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchJson } from "@/lib/client-api";
import { cn } from "@/lib/utils";
import { getSignalStatusVariant } from "@/lib/signal-performance";

type SignalWithTaken = Signal & { takenByMe?: boolean };

export function SignalCard({ signal }: { signal: SignalWithTaken }) {
  const bullish = signal.direction === "LONG";
  const [taken, setTaken] = useState(signal.takenByMe ?? false);
  const [isPending, setIsPending] = useState(false);

  const handleToggle = async () => {
    setIsPending(true);
    const optimistic = !taken;
    setTaken(optimistic);
    try {
      const res = await fetchJson<{ taken: boolean }>(`/api/signals/${signal.id}/take`, {
        method: "POST",
      });
      setTaken(res.taken);
      toast.success(res.taken ? "Signal marked as taken." : "Signal unmarked.");
    } catch {
      setTaken(!optimistic);
      toast.error("Could not update signal status.");
    } finally {
      setIsPending(false);
    }
  };

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
              <Badge variant={getSignalStatusVariant(signal.status)}>
                <span className="status-dot bg-current" />
                {signal.status}
              </Badge>
              <Badge variant="info">{signal.timeframe}</Badge>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <p className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(signal.postedAt), { addSuffix: true })}
          </p>
          <div className="flex flex-wrap justify-end gap-2">
            <Button asChild type="button" variant="ghost" size="sm" className="text-xs">
              <Link href={`/signals/${signal.id}`}>View details</Link>
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isPending}
              onClick={handleToggle}
              className={cn(
                "gap-2 text-xs transition-colors",
                taken
                  ? "border-[color:var(--color-green)]/40 bg-[color:var(--color-green-light)] text-[color:var(--color-green)] hover:bg-[color:var(--color-green-light)]"
                  : "text-muted-foreground",
              )}
            >
              {taken ? (
                <CheckCircle2 className="h-3.5 w-3.5" />
              ) : (
                <Circle className="h-3.5 w-3.5" />
              )}
              {taken ? "Signal taken" : "I took this"}
            </Button>
          </div>
        </div>
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
