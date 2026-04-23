"use client";

import type { EmotionState, Trade } from "@prisma/client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { Brain, CircleDot, Frown, Meh, Smile, Star, Zap } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { TradeChartUploadField } from "@/components/journal/TradeChartUploadField";
import { TagMultiSelect, type TagOption } from "@/components/tags/TagMultiSelect";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { TRADING_PAIRS } from "@/lib/constants";
import { calculateRR, calculateRiskPercent } from "@/lib/calculations";
import { fetchJson } from "@/lib/client-api";
import { tradeSchema } from "@/lib/validators";

type TradeValues = z.input<typeof tradeSchema>;

const emotionOptions: Array<{ value: EmotionState; label: string; icon: typeof Brain }> = [
  { value: "CALM", label: "Calm", icon: Smile },
  { value: "CONFIDENT", label: "Confident", icon: Zap },
  { value: "ANXIOUS", label: "Anxious", icon: Frown },
  { value: "FEARFUL", label: "Fearful", icon: Frown },
  { value: "GREEDY", label: "Greedy", icon: CircleDot },
  { value: "BORED", label: "Bored", icon: Meh },
  { value: "FRUSTRATED", label: "Frustrated", icon: Frown },
  { value: "EUPHORIC", label: "Euphoric", icon: Smile },
  { value: "NEUTRAL", label: "Neutral", icon: Brain },
];

export function AddTradeModal({
  open,
  onOpenChange,
  initialTrade,
  prefill,
  onSubmit,
  isSubmitting,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialTrade?: Trade | null;
  prefill?: { entryPrice?: number; stopLoss?: number; takeProfit?: number; rrRatio?: number };
  onSubmit: (values: TradeValues) => Promise<void> | void;
  isSubmitting?: boolean;
}) {
  const form = useForm<TradeValues>({
    resolver: zodResolver(tradeSchema),
    defaultValues: {
      coin: "BTC/USDT",
      direction: "LONG",
      entryPrice: prefill?.entryPrice ?? 0,
      stopLoss: prefill?.stopLoss ?? 0,
      takeProfit: prefill?.takeProfit ?? 0,
      tp2: undefined,
      tp3: undefined,
      pnlPercent: 0,
      outcome: "PENDING",
      setupType: "Break & Retest",
      tags: [],
      tradeDate: new Date().toISOString().slice(0, 10),
      notes: "",
      chartImageUrl: "",
      emotionBefore: null,
      emotionDuring: null,
      emotionAfter: null,
      followedPlan: null,
      revenge: false,
      overSized: false,
      movedStop: false,
      exitedEarly: false,
      tradeRating: null,
      mistakeNote: "",
      lessonLearned: "",
    },
  });

  const { data: tagData } = useQuery({
    queryKey: ["trade-tags"],
    queryFn: () => fetchJson<{ tags: TagOption[] }>("/api/trade-tags"),
  });

  useEffect(() => {
    if (initialTrade) {
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
        tags: initialTrade.tags ?? [],
        tradeDate: new Date(initialTrade.tradeDate).toISOString().slice(0, 10),
        notes: initialTrade.notes ?? "",
        chartImageUrl: initialTrade.chartImageUrl ?? "",
        emotionBefore: initialTrade.emotionBefore ?? null,
        emotionDuring: initialTrade.emotionDuring ?? null,
        emotionAfter: initialTrade.emotionAfter ?? null,
        followedPlan: initialTrade.followedPlan ?? null,
        revenge: initialTrade.revenge ?? false,
        overSized: initialTrade.overSized ?? false,
        movedStop: initialTrade.movedStop ?? false,
        exitedEarly: initialTrade.exitedEarly ?? false,
        tradeRating: initialTrade.tradeRating ?? null,
        mistakeNote: initialTrade.mistakeNote ?? "",
        lessonLearned: initialTrade.lessonLearned ?? "",
      });
    } else if (prefill) {
      form.reset({
        coin: "BTC/USDT",
        direction: "LONG",
        entryPrice: prefill.entryPrice ?? 0,
        stopLoss: prefill.stopLoss ?? 0,
        takeProfit: prefill.takeProfit ?? 0,
        tp2: undefined,
        tp3: undefined,
        pnlPercent: 0,
        outcome: "PENDING",
        setupType: "Break & Retest",
        tags: [],
        tradeDate: new Date().toISOString().slice(0, 10),
        notes: "",
        chartImageUrl: "",
        emotionBefore: null,
        emotionDuring: null,
        emotionAfter: null,
        followedPlan: null,
        revenge: false,
        overSized: false,
        movedStop: false,
        exitedEarly: false,
        tradeRating: null,
        mistakeNote: "",
        lessonLearned: "",
      });
    }
  }, [form, initialTrade, prefill]);

  const entryPrice = Number(form.watch("entryPrice") ?? 0);
  const stopLoss = Number(form.watch("stopLoss") ?? 0);
  const takeProfit = Number(form.watch("takeProfit") ?? 0);
  const rr = calculateRR(entryPrice, stopLoss, takeProfit);
  const risk = calculateRiskPercent(entryPrice, stopLoss);
  const followedPlan = form.watch("followedPlan");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initialTrade ? "Edit Trade" : prefill ? "Log Calculator Trade" : "Add Trade"}</DialogTitle>
          <DialogDescription>
            {prefill
              ? "Pre-filled from your calculator. Confirm the details and save."
              : "Log the setup, performance, and context behind the trade."}
          </DialogDescription>
        </DialogHeader>
        <form
          className="grid gap-4"
          onSubmit={form.handleSubmit(async (values) => {
            await onSubmit(values);
            // AUDIT FIX: After a successful CREATE, reset the form to defaults so
            // reopening the modal does not show the previously submitted values.
            if (!initialTrade) {
              form.reset();
            }
            onOpenChange(false);
          })}
        >
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Trading Pair <span className="text-destructive" aria-hidden="true">*</span></Label>
              <Input list="pair-list" {...form.register("coin")} />
              <datalist id="pair-list">
                {TRADING_PAIRS.map((pair) => (
                  <option key={pair} value={pair} />
                ))}
              </datalist>
              {/* AUDIT FIX: Added field-level error messages for all validated fields. */}
              {form.formState.errors.coin && <p className="text-sm text-destructive">{form.formState.errors.coin.message}</p>}
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
              <Label>Entry Price <span className="text-destructive" aria-hidden="true">*</span></Label>
              <Input type="number" step="any" {...form.register("entryPrice", { valueAsNumber: true })} />
              {form.formState.errors.entryPrice && <p className="text-sm text-destructive">{form.formState.errors.entryPrice.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Stop Loss <span className="text-destructive" aria-hidden="true">*</span></Label>
              <Input type="number" step="any" {...form.register("stopLoss", { valueAsNumber: true })} />
              {form.formState.errors.stopLoss && <p className="text-sm text-destructive">{form.formState.errors.stopLoss.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Take Profit 1 <span className="text-destructive" aria-hidden="true">*</span></Label>
              <Input type="number" step="any" {...form.register("takeProfit", { valueAsNumber: true })} />
              {form.formState.errors.takeProfit && <p className="text-sm text-destructive">{form.formState.errors.takeProfit.message}</p>}
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
              <Label>P&amp;L % <span className="text-destructive" aria-hidden="true">*</span></Label>
              <Input type="number" step="any" {...form.register("pnlPercent", { valueAsNumber: true })} />
              {form.formState.errors.pnlPercent && <p className="text-sm text-destructive">{form.formState.errors.pnlPercent.message}</p>}
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
            <div className="space-y-2 md:col-span-2">
              <Label>Tags</Label>
              <TagMultiSelect
                value={form.watch("tags") ?? []}
                options={tagData?.tags ?? []}
                onChange={(value) =>
                  form.setValue("tags", value, {
                    shouldDirty: true,
                    shouldTouch: true,
                    shouldValidate: true,
                  })
                }
                placeholder="Add context tags like Breakout, NY Session, or FOMO"
              />
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

          <div className="rounded-2xl border border-border p-4">
            <div className="mb-4 flex items-center justify-between">
              <p className="font-medium">Psychology</p>
            </div>

            <div className="space-y-4">
              {[
                { key: "emotionBefore", label: "Emotion before entry" },
                { key: "emotionDuring", label: "Emotion during trade" },
                { key: "emotionAfter", label: "Emotion after exit" },
              ].map((row) => (
                <div key={row.key} className="space-y-2">
                  <Label>{row.label}</Label>
                  <div className="flex flex-wrap gap-2">
                    {emotionOptions.map((option) => {
                      const Icon = option.icon;
                      const selected = form.watch(row.key as keyof TradeValues) === option.value;
                      return (
                        <Button
                          key={`${row.key}-${option.value}`}
                          type="button"
                          variant={selected ? "default" : "outline"}
                          size="sm"
                          className="rounded-full"
                          onClick={() =>
                            form.setValue(row.key as keyof TradeValues, option.value as never, {
                              shouldDirty: true,
                              shouldValidate: true,
                            })
                          }
                        >
                          <Icon className="mr-1 h-3.5 w-3.5" />
                          {option.label}
                        </Button>
                      );
                    })}
                  </div>
                </div>
              ))}

              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  { key: "followedPlan", label: "Followed my plan" },
                  { key: "revenge", label: "Revenge trade" },
                  { key: "overSized", label: "Over-sized" },
                  { key: "movedStop", label: "Moved stop" },
                  { key: "exitedEarly", label: "Exited early" },
                ].map((field) => (
                  <label key={field.key} className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={Boolean(form.watch(field.key as keyof TradeValues))}
                      onCheckedChange={(checked) =>
                        form.setValue(field.key as keyof TradeValues, Boolean(checked) as never, {
                          shouldDirty: true,
                          shouldValidate: true,
                        })
                      }
                    />
                    {field.label}
                  </label>
                ))}
              </div>

              <div className="space-y-2">
                <Label>Overall trade quality</Label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <button
                      key={value}
                      type="button"
                      aria-label={`Rate trade ${value} star${value > 1 ? "s" : ""}`}
                      title={`Rate trade ${value}`}
                      onClick={() =>
                        form.setValue("tradeRating", value, {
                          shouldDirty: true,
                          shouldValidate: true,
                        })
                      }
                      className="text-muted-foreground transition hover:text-primary"
                    >
                      <Star
                        className={`h-5 w-5 ${Number(form.watch("tradeRating") ?? 0) >= value ? "fill-primary text-primary" : ""}`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {followedPlan === false ? (
                <div className="grid gap-3">
                  <div className="space-y-2">
                    <Label>Mistake made</Label>
                    <Textarea {...form.register("mistakeNote")} />
                  </div>
                  <div className="space-y-2">
                    <Label>Lesson learned</Label>
                    <Textarea {...form.register("lessonLearned")} />
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Chart Image</Label>
            <TradeChartUploadField
              imageUrl={form.watch("chartImageUrl") || null}
              onUpload={(url) =>
                form.setValue("chartImageUrl", url, {
                  shouldDirty: true,
                  shouldTouch: true,
                  shouldValidate: true,
                })
              }
              onRemove={() =>
                form.setValue("chartImageUrl", "", {
                  shouldDirty: true,
                  shouldTouch: true,
                  shouldValidate: true,
                })
              }
            />
          </div>

          <Button disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : initialTrade ? "Update Trade" : "Save Trade"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
