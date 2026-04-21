"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { weeklyRecapSchema } from "@/lib/validators";

type WeeklyRecapValues = z.input<typeof weeklyRecapSchema>;

function getDefaultValues(
  initialValues?: Partial<WeeklyRecapValues> | null,
): WeeklyRecapValues {
  return {
    weekStartDate: initialValues?.weekStartDate ?? new Date().toISOString().slice(0, 10),
    weekEndDate: initialValues?.weekEndDate ?? new Date().toISOString().slice(0, 10),
    totalTrades: initialValues?.totalTrades ?? 0,
    wins: initialValues?.wins ?? 0,
    losses: initialValues?.losses ?? 0,
    winRate: initialValues?.winRate ?? 0,
    bestTrade: initialValues?.bestTrade ?? "",
    worstTrade: initialValues?.worstTrade ?? "",
    totalPnlPercent: initialValues?.totalPnlPercent ?? 0,
    whatWeLearned: initialValues?.whatWeLearned ?? "",
    nextWeekFocus: initialValues?.nextWeekFocus ?? "",
  };
}

export function WeeklyRecapForm({
  initialValues,
  onSubmit,
  isSubmitting,
  submitLabel = "Save recap",
}: {
  initialValues?: Partial<WeeklyRecapValues> | null;
  onSubmit: (values: WeeklyRecapValues) => Promise<void>;
  isSubmitting?: boolean;
  submitLabel?: string;
}) {
  const form = useForm<WeeklyRecapValues>({
    resolver: zodResolver(weeklyRecapSchema),
    defaultValues: getDefaultValues(initialValues),
  });

  const totalTrades = Number(form.watch("totalTrades") ?? 0);
  const wins = Number(form.watch("wins") ?? 0);

  useEffect(() => {
    form.reset(getDefaultValues(initialValues));
  }, [form, initialValues]);

  useEffect(() => {
    const calculated = totalTrades > 0 ? (wins / totalTrades) * 100 : 0;
    form.setValue("winRate", Number(calculated.toFixed(2)), {
      shouldDirty: false,
    });
  }, [form, totalTrades, wins]);

  const weekStartDate = form.watch("weekStartDate")
    ? new Date(form.watch("weekStartDate"))
    : undefined;
  const weekEndDate = form.watch("weekEndDate")
    ? new Date(form.watch("weekEndDate"))
    : undefined;

  return (
    <form
      className="grid grid-cols-1 gap-4 md:grid-cols-2"
      onSubmit={form.handleSubmit(async (values) => {
        await onSubmit(values);
      })}
    >
      <div className="space-y-2">
        <Label>Week start date</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              className={cn(
                "justify-start",
                !weekStartDate && "text-muted-foreground",
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {weekStartDate ? format(weekStartDate, "PPP") : "Select start date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={weekStartDate}
              onSelect={(date) => {
                if (date) {
                  form.setValue("weekStartDate", format(date, "yyyy-MM-dd"));
                }
              }}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>
      <div className="space-y-2">
        <Label>Week end date</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              className={cn(
                "justify-start",
                !weekEndDate && "text-muted-foreground",
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {weekEndDate ? format(weekEndDate, "PPP") : "Select end date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={weekEndDate}
              onSelect={(date) => {
                if (date) {
                  form.setValue("weekEndDate", format(date, "yyyy-MM-dd"));
                }
              }}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>
      <div className="space-y-2">
        <Label>Total trades</Label>
        <Input
          type="number"
          {...form.register("totalTrades", { valueAsNumber: true })}
        />
      </div>
      <div className="space-y-2">
        <Label>Wins</Label>
        <Input type="number" {...form.register("wins", { valueAsNumber: true })} />
      </div>
      <div className="space-y-2">
        <Label>Losses</Label>
        <Input type="number" {...form.register("losses", { valueAsNumber: true })} />
      </div>
      <div className="space-y-2">
        <Label>Win rate</Label>
        <Input
          type="number"
          step="any"
          readOnly
          {...form.register("winRate", { valueAsNumber: true })}
        />
      </div>
      <div className="space-y-2">
        <Label>Best trade</Label>
        <Input {...form.register("bestTrade")} />
      </div>
      <div className="space-y-2">
        <Label>Worst trade</Label>
        <Input {...form.register("worstTrade")} />
      </div>
      <div className="space-y-2">
        <Label>Total P&amp;L %</Label>
        <Input
          type="number"
          step="any"
          {...form.register("totalPnlPercent", { valueAsNumber: true })}
        />
      </div>
      <div className="space-y-2 md:col-span-2">
        <Label>What we learned</Label>
        <Textarea className="min-h-[120px]" {...form.register("whatWeLearned")} />
      </div>
      <div className="space-y-2 md:col-span-2">
        <Label>Next week focus</Label>
        <Textarea className="min-h-[120px]" {...form.register("nextWeekFocus")} />
      </div>
      <div className="md:col-span-2">
        <Button disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : submitLabel}
        </Button>
      </div>
    </form>
  );
}
