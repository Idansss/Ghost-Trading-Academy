"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { MetricCard } from "@/components/shared/MetricCard";
import { VerdictCard } from "@/components/calculator/VerdictCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { calculatePositionSize, calculateRR } from "@/lib/calculations";
import { formatCurrency } from "@/lib/utils";
import { riskCalculatorSchema } from "@/lib/validators";

type RiskCalculatorValues = z.input<typeof riskCalculatorSchema>;

type RiskCalculatorProps = {
  entry?: number;
  stopLoss?: number;
  tp1?: number;
  tp2?: number;
  tp3?: number;
  showLogTradeAction?: boolean;
  title?: string;
  description?: string;
};

type TargetKey = "tp1" | "tp2" | "tp3";

const targetRows: Array<{ key: TargetKey; label: string }> = [
  { key: "tp1", label: "TP1" },
  { key: "tp2", label: "TP2" },
  { key: "tp3", label: "TP3" },
];

function buildDefaultValues(
  savedAccountSize: number,
  savedRiskPerTrade: number,
  props: Pick<RiskCalculatorProps, "entry" | "stopLoss" | "tp1" | "tp2" | "tp3">,
): RiskCalculatorValues {
  return {
    accountSize: savedAccountSize,
    riskPerTrade: savedRiskPerTrade,
    entry: props.entry ?? 0,
    stopLoss: props.stopLoss ?? 0,
    tp1: props.tp1 ?? undefined,
    tp2: props.tp2 ?? undefined,
    tp3: props.tp3 ?? undefined,
  };
}

export function RiskCalculator({
  entry,
  stopLoss,
  tp1,
  tp2,
  tp3,
  showLogTradeAction = false,
  title = "Position Size Calculator",
  description = "Size the trade before you enter so your downside stays planned.",
}: RiskCalculatorProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const savedAccountSize = session?.user.accountSize ?? session?.user.accountBalance ?? 10000;
  const savedRiskPerTrade = session?.user.riskPerTrade ?? 1;

  const form = useForm<RiskCalculatorValues>({
    resolver: zodResolver(riskCalculatorSchema),
    defaultValues: buildDefaultValues(savedAccountSize, savedRiskPerTrade, {
      entry,
      stopLoss,
      tp1,
      tp2,
      tp3,
    }),
  });

  useEffect(() => {
    form.reset(
      buildDefaultValues(savedAccountSize, savedRiskPerTrade, {
        entry,
        stopLoss,
        tp1,
        tp2,
        tp3,
      }),
    );
  }, [entry, form, savedAccountSize, savedRiskPerTrade, stopLoss, tp1, tp2, tp3]);

  const values = form.watch();
  const metrics = useMemo(() => {
    const accountSizeValue = Number(values.accountSize) || 0;
    const riskPercentValue = Number(values.riskPerTrade) || 0;
    const entryValue = Number(values.entry) || 0;
    const stopLossValue = Number(values.stopLoss) || 0;
    const riskAmount = accountSizeValue * (riskPercentValue / 100);
    const units = calculatePositionSize(accountSizeValue, riskPercentValue, entryValue, stopLossValue);
    const positionSizeUsd = entryValue > 0 ? units * entryValue : 0;

    const targets = targetRows.map(({ key, label }) => {
      const targetValue = Number(values[key] ?? 0);
      const rr = entryValue > 0 && stopLossValue > 0 && targetValue > 0
        ? calculateRR(entryValue, stopLossValue, targetValue)
        : 0;

      return {
        key,
        label,
        price: targetValue,
        rr,
        profitUsd: riskAmount * rr,
      };
    });

    return {
      riskAmount,
      units,
      positionSizeUsd,
      primaryRr: targets[0]?.rr ?? 0,
      targets,
      hasValidStructure:
        accountSizeValue > 0 &&
        riskPercentValue > 0 &&
        entryValue > 0 &&
        stopLossValue > 0 &&
        targets.some((target) => target.price > 0),
    };
  }, [values]);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <Card>
          <CardHeader>
            <CardTitle>Inputs</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="accountSize">Account Size ($)</Label>
                <Input
                  id="accountSize"
                  type="number"
                  step="any"
                  {...form.register("accountSize", { valueAsNumber: true })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="riskPerTrade">Risk Per Trade (%)</Label>
                <Input
                  id="riskPerTrade"
                  type="number"
                  step="any"
                  {...form.register("riskPerTrade", { valueAsNumber: true })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="entry">Entry</Label>
                <Input
                  id="entry"
                  type="number"
                  step="any"
                  {...form.register("entry", { valueAsNumber: true })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="stopLoss">Stop Loss</Label>
                <Input
                  id="stopLoss"
                  type="number"
                  step="any"
                  {...form.register("stopLoss", { valueAsNumber: true })}
                />
              </div>
              {targetRows.map((target) => (
                <div key={target.key} className="space-y-2">
                  <Label htmlFor={target.key}>{target.label}</Label>
                  <Input
                    id={target.key}
                    type="number"
                    step="any"
                    {...form.register(target.key, {
                      setValueAs: (value) => (value === "" ? undefined : Number(value)),
                    })}
                  />
                </div>
              ))}
            </form>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <MetricCard label="Risk Amount" value={formatCurrency(metrics.riskAmount)} tone="negative" />
            <MetricCard label="Position Size (USD)" value={formatCurrency(metrics.positionSizeUsd)} />
            <MetricCard label="Position Size (Units)" value={metrics.units.toFixed(4)} />
            <MetricCard
              label="Primary R:R"
              value={`${metrics.primaryRr.toFixed(2)}R`}
              tone={
                metrics.primaryRr >= 2 ? "positive" : metrics.primaryRr >= 1 ? "neutral" : "negative"
              }
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Target Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {metrics.targets.map((target) => (
                <div
                  key={target.key}
                  className="grid gap-3 rounded-2xl border border-border px-4 py-4 md:grid-cols-[0.8fr_1fr_1fr_1fr]"
                >
                  <div>
                    <p className="text-sm font-medium">{target.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {target.price > 0 ? target.price.toLocaleString("en-US") : "No target set"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">R:R</p>
                    <p className="mt-1 text-sm font-medium">{target.price > 0 ? `${target.rr.toFixed(2)}R` : "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Profit (USD)</p>
                    <p className="mt-1 text-sm font-medium">{target.price > 0 ? formatCurrency(target.profitUsd) : "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Profit (R)</p>
                    <p className="mt-1 text-sm font-medium">{target.price > 0 ? `${target.rr.toFixed(2)}R` : "N/A"}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <VerdictCard rrRatio={metrics.primaryRr} />

          {showLogTradeAction && metrics.hasValidStructure ? (
            <Button
              type="button"
              variant="outline"
              className="w-full gap-2"
              onClick={() => {
                const params = new URLSearchParams({
                  entry: String(Number(values.entry) || 0),
                  stopLoss: String(Number(values.stopLoss) || 0),
                  takeProfit: String(Number(values.tp1) || 0),
                  rr: metrics.primaryRr.toFixed(2),
                });
                router.push(`/journal?${params.toString()}`);
              }}
            >
              Log this trade in journal
              <ArrowRight className="h-4 w-4" />
            </Button>
          ) : null}

          {!showLogTradeAction && metrics.hasValidStructure ? (
            <div className="rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-muted-foreground">
              Save your account size and risk rule in{" "}
              <Link href="/profile" className="font-medium text-primary hover:underline">
                profile settings
              </Link>{" "}
              so this calculator loads your defaults everywhere.
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
