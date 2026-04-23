"use client";

import type { Trade } from "@prisma/client";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { CalendarIcon, ImageIcon, Trash2 } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useQueryClient } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import type { z } from "zod";
import {
  deleteTradeAction,
  saveTradeNotesAction,
  updateTradeAction,
} from "@/lib/actions/trades";
import { TradeChartUploadField } from "@/components/journal/TradeChartUploadField";
import { calculateRR } from "@/lib/calculations";
import { tradeSchema } from "@/lib/validators";
import { RichNotesEditor } from "@/components/journal/RichNotesEditor";
import { TagMultiSelect, type TagOption } from "@/components/tags/TagMultiSelect";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { fetchJson } from "@/lib/client-api";
import { cn } from "@/lib/utils";

type TradeValues = z.input<typeof tradeSchema>;

function toTradeValues(trade: Trade): TradeValues {
  return {
    coin: trade.coin,
    direction: trade.direction,
    entryPrice: trade.entryPrice,
    stopLoss: trade.stopLoss,
    takeProfit: trade.takeProfit,
    tp2: trade.tp2 ?? undefined,
    tp3: trade.tp3 ?? undefined,
    pnlPercent: trade.pnlPercent,
    outcome: trade.outcome,
    setupType: trade.setupType,
    tags: trade.tags ?? [],
    notes: trade.notes ?? "",
    chartImageUrl: trade.chartImageUrl ?? "",
    tradeDate: new Date(trade.tradeDate).toISOString().slice(0, 10),
  };
}

export function TradeDetailDrawer({
  trade,
  open,
  onOpenChange,
  onTradeUpdated,
  onTradeDeleted,
}: {
  trade: Trade | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTradeUpdated?: (trade: Trade) => void;
  onTradeDeleted?: (tradeId: string) => void;
}) {
  const queryClient = useQueryClient();
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const form = useForm<TradeValues>({
    resolver: zodResolver(tradeSchema),
    defaultValues: trade ? toTradeValues(trade) : undefined,
  });

  const { data: tagData } = useQuery({
    queryKey: ["trade-tags"],
    queryFn: () => fetchJson<{ tags: TagOption[] }>("/api/trade-tags"),
  });

  useEffect(() => {
    if (!trade) {
      return;
    }

    form.reset(toTradeValues(trade));
  }, [form, trade]);

  if (!trade) {
    return null;
  }

  const entryPrice = Number(form.watch("entryPrice") ?? 0);
  const stopLoss = Number(form.watch("stopLoss") ?? 0);
  const tp1 = Number(form.watch("takeProfit") ?? 0);
  const tp2 = Number(form.watch("tp2") ?? 0);
  const tp3 = Number(form.watch("tp3") ?? 0);
  const selectedDate = form.watch("tradeDate")
    ? new Date(form.watch("tradeDate"))
    : undefined;

  const rrTargets = [
    { label: "TP1", target: tp1 },
    { label: "TP2", target: tp2 },
    { label: "TP3", target: tp3 },
  ].filter((item) => Number.isFinite(item.target) && item.target > 0);

  const handleSave = form.handleSubmit(async (values) => {
    setIsSaving(true);

    try {
      const updatedTrade = await updateTradeAction(trade.id, values);
      onTradeUpdated?.(updatedTrade);
      await queryClient.invalidateQueries({ queryKey: ["trades"] });
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Trade saved successfully");
      onOpenChange(false);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to save trade. Please try again.",
      );
    } finally {
      setIsSaving(false);
    }
  });

  const handleDelete = async () => {
    setIsDeleting(true);

    try {
      await deleteTradeAction(trade.id);
      onTradeDeleted?.(trade.id);
      await queryClient.invalidateQueries({ queryKey: ["trades"] });
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Trade deleted successfully");
      onOpenChange(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete trade.",
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{trade.coin}</SheetTitle>
          <SheetDescription>
            Review the trade details, update execution data, and maintain your
            journal notes.
          </SheetDescription>
        </SheetHeader>

        <Tabs defaultValue="details" className="mt-4 space-y-4">
          <TabsList>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="notes">Notes</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="trade-coin">Trading Pair</Label>
                <Input id="trade-coin" {...form.register("coin")} />
              </div>

              <div className="space-y-2">
                <Label>Direction</Label>
                <div className="grid grid-cols-2 gap-2">
                  {(["LONG", "SHORT"] as const).map((direction) => (
                    <button
                      key={direction}
                      type="button"
                      onClick={() => form.setValue("direction", direction)}
                      className={cn(
                        "rounded-xl border px-4 py-2 text-sm font-medium transition-colors",
                        form.watch("direction") === direction
                          ? "border-[color:var(--color-gold)] bg-[color:var(--color-gold-light)] text-[color:var(--color-gold)]"
                          : "border-border bg-transparent text-muted-foreground hover:bg-accent",
                      )}
                    >
                      {direction}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="trade-entry">Entry Price</Label>
                <Input
                  id="trade-entry"
                  type="number"
                  step="any"
                  {...form.register("entryPrice", { valueAsNumber: true })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="trade-stop-loss">Stop Loss</Label>
                <Input
                  id="trade-stop-loss"
                  type="number"
                  step="any"
                  {...form.register("stopLoss", { valueAsNumber: true })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="trade-tp1">Take Profit 1</Label>
                <Input
                  id="trade-tp1"
                  type="number"
                  step="any"
                  {...form.register("takeProfit", { valueAsNumber: true })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="trade-tp2">Take Profit 2</Label>
                <Input
                  id="trade-tp2"
                  type="number"
                  step="any"
                  {...form.register("tp2", { valueAsNumber: true })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="trade-tp3">Take Profit 3</Label>
                <Input
                  id="trade-tp3"
                  type="number"
                  step="any"
                  {...form.register("tp3", { valueAsNumber: true })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="trade-pnl-percent">P&amp;L Percent</Label>
                <Input
                  id="trade-pnl-percent"
                  type="number"
                  step="any"
                  {...form.register("pnlPercent", { valueAsNumber: true })}
                />
              </div>

              <div className="space-y-2">
                <Label>Outcome</Label>
                <Select
                  value={form.watch("outcome")}
                  onValueChange={(value) =>
                    form.setValue("outcome", value as TradeValues["outcome"])
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["WIN", "LOSS", "BREAKEVEN", "PENDING", "CANCELLED"].map(
                      (outcome) => (
                        <SelectItem key={outcome} value={outcome}>
                          {outcome}
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="trade-setup-type">Setup Type</Label>
                <Input id="trade-setup-type" {...form.register("setupType")} />
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
                  placeholder="Choose all tags that describe this trade"
                />
              </div>

              <div className="space-y-2">
                <Label>Trade Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className={cn(
                        "w-full justify-between",
                        !selectedDate && "text-muted-foreground",
                      )}
                    >
                      {selectedDate
                        ? format(selectedDate, "PPP")
                        : "Select trade date"}
                      <CalendarIcon className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date) => {
                        if (!date) {
                          return;
                        }

                        form.setValue(
                          "tradeDate",
                          format(date, "yyyy-MM-dd"),
                          {
                            shouldDirty: true,
                          },
                        );
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="rounded-2xl border border-[color:var(--bg-border)] bg-background/60 p-4">
              <p className="text-xs font-medium uppercase tracking-[0.24em] text-muted-foreground">
                Live R:R
              </p>
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                {rrTargets.map((item) => (
                  <div
                    key={item.label}
                    className="rounded-xl border border-border bg-card p-4"
                  >
                    <p className="text-xs text-muted-foreground">{item.label}</p>
                    <p className="mt-2 text-xl font-semibold">
                      {calculateRR(entryPrice, stopLoss, item.target).toFixed(2)}R
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3">
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
              {form.watch("chartImageUrl") ? (
                <Dialog>
                  <DialogTrigger asChild>
                    <Button type="button" variant="outline" className="w-full gap-2">
                      <ImageIcon className="h-4 w-4" />
                      View full chart
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-5xl p-3">
                    <DialogHeader className="sr-only">
                      <DialogTitle>Trade chart image</DialogTitle>
                      <DialogDescription>Expanded chart screenshot for this trade.</DialogDescription>
                    </DialogHeader>
                    <div className="relative h-[82vh] w-full">
                      <Image
                        src={form.watch("chartImageUrl") || ""}
                        alt={`${trade.coin} chart attachment`}
                        fill
                        className="rounded-2xl object-contain"
                        sizes="100vw"
                      />
                    </div>
                  </DialogContent>
                </Dialog>
              ) : null}
            </div>

            <div className="flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:justify-between">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button type="button" variant="destructive" disabled={isDeleting}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Trade
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete this trade?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently remove the trade from your journal.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete}>
                      Confirm delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <Button type="button" onClick={handleSave} disabled={isSaving}>
                {isSaving ? "Saving..." : "Save Trade"}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="notes" className="space-y-4">
            <RichNotesEditor
              value={trade.notes ?? ""}
              onSave={async (content) => {
                const updatedTrade = await saveTradeNotesAction(trade.id, content);
                onTradeUpdated?.(updatedTrade);
              }}
            />
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
