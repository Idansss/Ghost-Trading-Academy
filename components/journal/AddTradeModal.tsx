"use client";

import type { Trade } from "@prisma/client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { TRADING_PAIRS } from "@/lib/constants";
import { calculateRR, calculateRiskPercent } from "@/lib/calculations";
import { tradeSchema } from "@/lib/validators";

type TradeValues = z.input<typeof tradeSchema>;

export function AddTradeModal({
  open,
  onOpenChange,
  initialTrade,
  onSubmit,
  isSubmitting,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialTrade?: Trade | null;
  onSubmit: (values: TradeValues) => Promise<void> | void;
  isSubmitting?: boolean;
}) {
  const form = useForm<TradeValues>({
    resolver: zodResolver(tradeSchema),
    defaultValues: {
      coin: "BTC/USDT",
      direction: "LONG",
      entryPrice: 0,
      stopLoss: 0,
      takeProfit: 0,
      tp2: undefined,
      tp3: undefined,
      pnlPercent: 0,
      outcome: "PENDING",
      setupType: "Break & Retest",
      tradeDate: new Date().toISOString().slice(0, 10),
      notes: "",
    },
  });

  useEffect(() => {
    if (!initialTrade) return;
    form.reset({
      coin: initialTrade.coin,
      direction: initialTrade.direction,
      entryPrice: initialTrade.entryPrice,
      stopLoss: initialTrade.stopLoss,
      takeProfit: initialTrade.takeProfit,
      tp2: initialTrade.tp2 ?? undefined,
      tp3: initialTrade.tp3 ?? undefined,
      pnlPercent: initialTrade.pnlPercent,
      outcome: initialTrade.outcome,
      setupType: initialTrade.setupType,
      tradeDate: new Date(initialTrade.tradeDate).toISOString().slice(0, 10),
      notes: initialTrade.notes ?? "",
    });
  }, [form, initialTrade]);

  const entryPrice = Number(form.watch("entryPrice") ?? 0);
  const stopLoss = Number(form.watch("stopLoss") ?? 0);
  const takeProfit = Number(form.watch("takeProfit") ?? 0);
  const rr = calculateRR(entryPrice, stopLoss, takeProfit);
  const risk = calculateRiskPercent(entryPrice, stopLoss);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initialTrade ? "Edit Trade" : "Add Trade"}</DialogTitle>
          <DialogDescription>
            Log the setup, performance, and context behind the trade.
          </DialogDescription>
        </DialogHeader>
        <form
          className="grid gap-4"
          onSubmit={form.handleSubmit(async (values) => {
            await onSubmit(values);
            onOpenChange(false);
          })}
        >
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Trading Pair</Label>
              <Input list="pair-list" {...form.register("coin")} />
              <datalist id="pair-list">
                {TRADING_PAIRS.map((pair) => (
                  <option key={pair} value={pair} />
                ))}
              </datalist>
            </div>
            <div className="space-y-2">
              <Label>Direction</Label>
              <Select
                value={form.watch("direction")}
                onValueChange={(value) => form.setValue("direction", value as "LONG" | "SHORT")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LONG">LONG</SelectItem>
                  <SelectItem value="SHORT">SHORT</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Entry Price</Label>
              <Input type="number" step="any" {...form.register("entryPrice", { valueAsNumber: true })} />
            </div>
            <div className="space-y-2">
              <Label>Stop Loss</Label>
              <Input type="number" step="any" {...form.register("stopLoss", { valueAsNumber: true })} />
            </div>
            <div className="space-y-2">
              <Label>Take Profit 1</Label>
              <Input type="number" step="any" {...form.register("takeProfit", { valueAsNumber: true })} />
            </div>
            <div className="space-y-2">
              <Label>TP2</Label>
              <Input type="number" step="any" {...form.register("tp2", { valueAsNumber: true })} />
            </div>
            <div className="space-y-2">
              <Label>TP3</Label>
              <Input type="number" step="any" {...form.register("tp3", { valueAsNumber: true })} />
            </div>
            <div className="space-y-2">
              <Label>P&L %</Label>
              <Input type="number" step="any" {...form.register("pnlPercent", { valueAsNumber: true })} />
            </div>
            <div className="space-y-2">
              <Label>Outcome</Label>
              <Select
                value={form.watch("outcome")}
                onValueChange={(value) =>
                  form.setValue(
                    "outcome",
                    value as TradeValues["outcome"],
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["WIN", "LOSS", "BREAKEVEN", "PENDING", "CANCELLED"].map((item) => (
                    <SelectItem key={item} value={item}>
                      {item}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Setup Type</Label>
              <Input {...form.register("setupType")} />
            </div>
            <div className="space-y-2">
              <Label>Trade Date</Label>
              <Input type="date" {...form.register("tradeDate")} />
            </div>
          </div>

          <div className="surface-elevated rounded-3xl border border-border p-4">
            <p className="text-xs font-medium uppercase tracking-[0.24em] text-primary">
              Live Preview
            </p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-border p-4">
                <p className="text-xs text-muted-foreground">R:R Ratio</p>
                <p className="mt-2 text-2xl font-semibold">{rr.toFixed(2)}R</p>
              </div>
              <div className="rounded-2xl border border-border p-4">
                <p className="text-xs text-muted-foreground">Risk %</p>
                <p className="mt-2 text-2xl font-semibold">{risk.toFixed(2)}%</p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea {...form.register("notes")} />
          </div>

          <Button disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : initialTrade ? "Update Trade" : "Save Trade"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
