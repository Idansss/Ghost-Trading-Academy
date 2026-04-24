"use client";

import type { DailyOutlook } from "@prisma/client";
import { zodResolver } from "@hookform/resolvers/zod";
import { Trash2 } from "lucide-react";
import { useEffect } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { outlookSchema } from "@/lib/validators";

type OutlookValues = z.infer<typeof outlookSchema>;

const biasOptions: Array<{
  value: OutlookValues["marketBias"];
  label: string;
  className: string;
}> = [
  {
    value: "BULLISH",
    label: "BULLISH",
    className:
      "data-[active=true]:border-[color:var(--color-green)] data-[active=true]:bg-[color:var(--color-green)] data-[active=true]:text-white",
  },
  {
    value: "BEARISH",
    label: "BEARISH",
    className:
      "data-[active=true]:border-[color:var(--color-red)] data-[active=true]:bg-[color:var(--color-red)] data-[active=true]:text-white",
  },
  {
    value: "NEUTRAL",
    label: "NEUTRAL",
    className:
      "data-[active=true]:border-border data-[active=true]:bg-muted data-[active=true]:text-foreground",
  },
  {
    value: "RANGING",
    label: "RANGING",
    className:
      "data-[active=true]:border-amber-500 data-[active=true]:bg-amber-500 data-[active=true]:text-white",
  },
];

function getDefaultValues(initialValues?: Partial<OutlookValues> | null): OutlookValues {
  return {
    marketBias: initialValues?.marketBias ?? "NEUTRAL",
    biasExplanation: initialValues?.biasExplanation ?? "",
    coinsToWatch: initialValues?.coinsToWatch ?? [{ coin: "", note: "" }],
    levels:
      initialValues?.levels ?? [{ coin: "", resistance: "", support: "" }],
    avoidToday: initialValues?.avoidToday ?? [""],
  };
}

export function OutlookForm({
  initialValues,
  onSubmit,
  isSubmitting,
  redirectTo = "/admin",
}: {
  initialValues?: Partial<DailyOutlook> | Partial<OutlookValues> | null;
  onSubmit: (values: OutlookValues) => Promise<void>;
  isSubmitting?: boolean;
  redirectTo?: string | null;
}) {
  const router = useRouter();
  const form = useForm<OutlookValues>({
    resolver: zodResolver(outlookSchema),
    defaultValues: getDefaultValues(initialValues as Partial<OutlookValues> | null),
  });

  const coinsFieldArray = useFieldArray({
    control: form.control,
    name: "coinsToWatch",
  });

  const levelsFieldArray = useFieldArray({
    control: form.control,
    name: "levels",
  });

  const avoidToday = form.watch("avoidToday");

  useEffect(() => {
    form.reset(getDefaultValues(initialValues as Partial<OutlookValues> | null));
  }, [form, initialValues]);

  return (
    <form
      className="grid gap-6"
      onSubmit={form.handleSubmit(async (values) => {
        await onSubmit(values);
        toast.success(
          initialValues ? "Today's outlook has been updated." : "Today's outlook has been posted.",
        );
        if (redirectTo) {
          router.push(redirectTo);
        }
        router.refresh();
      })}
    >
      <div className="space-y-3">
        <Label>Market bias</Label>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          {biasOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              data-active={form.watch("marketBias") === option.value}
              onClick={() => form.setValue("marketBias", option.value)}
              className={cn(
                "rounded-xl border border-border px-4 py-3 text-sm font-semibold text-muted-foreground transition-colors",
                option.className,
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="bias-explanation">Bias explanation</Label>
        <Textarea
          id="bias-explanation"
          rows={3}
          className="min-h-[96px] resize-y"
          placeholder="Explain the market structure, key context, and what is driving today's bias..."
          {...form.register("biasExplanation")}
        />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <Label>Coins to watch</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => coinsFieldArray.append({ coin: "", note: "" })}
          >
            + Add coin
          </Button>
        </div>
        <div className="space-y-3">
          {coinsFieldArray.fields.map((field, index) => (
            <div key={field.id} className="grid grid-cols-1 gap-3 md:grid-cols-[120px_1fr_auto]">
              <Input
                placeholder="BTC/USDT"
                {...form.register(`coinsToWatch.${index}.coin`)}
              />
              <Input
                placeholder="OB at 96,200 - watching for retest entry"
                {...form.register(`coinsToWatch.${index}.note`)}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                disabled={coinsFieldArray.fields.length === 1}
                onClick={() => coinsFieldArray.remove(index)}
              >
                <Trash2 className="h-4 w-4 text-[color:var(--color-red)]" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <Label>Key levels</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              levelsFieldArray.append({ coin: "", resistance: "", support: "" })
            }
          >
            + Add coin levels
          </Button>
        </div>
        <div className="space-y-3">
          {levelsFieldArray.fields.map((field, index) => (
            <div key={field.id} className="grid grid-cols-1 gap-3 md:grid-cols-[100px_1fr_1fr_auto]">
              <Input
                placeholder="BTC"
                {...form.register(`levels.${index}.coin`)}
              />
              <Input
                placeholder="98,400 / 101,200"
                {...form.register(`levels.${index}.resistance`)}
              />
              <Input
                placeholder="95,100 / 93,800"
                {...form.register(`levels.${index}.support`)}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                disabled={levelsFieldArray.fields.length === 1}
                onClick={() => levelsFieldArray.remove(index)}
              >
                <Trash2 className="h-4 w-4 text-[color:var(--color-red)]" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <Label>What to avoid today</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              form.setValue("avoidToday", [...avoidToday, ""], {
                shouldDirty: true,
              })
            }
          >
            + Add rule
          </Button>
        </div>
        <div className="space-y-3">
          {avoidToday.map((item, index) => (
            <div key={`${index}-${item}`} className="grid grid-cols-[1fr_auto] gap-3">
              <Input
                value={item}
                placeholder="Chasing moves already 5%+ extended"
                onChange={(event) => {
                  const nextItems = [...avoidToday];
                  nextItems[index] = event.target.value;
                  form.setValue("avoidToday", nextItems, { shouldDirty: true });
                }}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                disabled={avoidToday.length === 1}
                onClick={() => {
                  form.setValue(
                    "avoidToday",
                    avoidToday.filter((_, itemIndex) => itemIndex !== index),
                    { shouldDirty: true },
                  );
                }}
              >
                <Trash2 className="h-4 w-4 text-[color:var(--color-red)]" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting
            ? "Publishing..."
            : initialValues
              ? "Update outlook"
              : "Post outlook"}
        </Button>
      </div>
    </form>
  );
}
