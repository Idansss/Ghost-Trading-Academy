"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import type { Signal } from "@prisma/client";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { signalOutcomeSchema } from "@/lib/validators";

type OutcomeValues = z.input<typeof signalOutcomeSchema>;

const outcomeFields: Array<{ key: keyof Pick<OutcomeValues, "tp1Hit" | "tp2Hit" | "tp3Hit" | "stopHit">; label: string }> = [
  { key: "tp1Hit", label: "TP1 hit" },
  { key: "tp2Hit", label: "TP2 hit" },
  { key: "tp3Hit", label: "TP3 hit" },
  { key: "stopHit", label: "Stop loss hit" },
];

function getDefaults(signal: Signal): OutcomeValues {
  return {
    status: signal.status,
    outcomeNote: signal.outcomeNote ?? "",
    tp1Hit: signal.tp1Hit,
    tp2Hit: signal.tp2Hit,
    tp3Hit: signal.tp3Hit,
    stopHit: signal.stopHit,
    finalPnlR: signal.finalPnlR ?? undefined,
  };
}

export function UpdateSignalOutcomeForm({
  signal,
  onSubmit,
  isSubmitting,
}: {
  signal: Signal;
  onSubmit: (values: OutcomeValues) => Promise<void>;
  isSubmitting?: boolean;
}) {
  const form = useForm<OutcomeValues>({
    resolver: zodResolver(signalOutcomeSchema),
    defaultValues: getDefaults(signal),
  });

  useEffect(() => {
    form.reset(getDefaults(signal));
  }, [form, signal]);

  return (
    <form
      className="space-y-5"
      onSubmit={form.handleSubmit(async (values) => {
        await onSubmit(values);
      })}
    >
      <div className="space-y-2">
        <Label>Status</Label>
        <Select
          value={form.watch("status")}
          onValueChange={(value) => form.setValue("status", value as OutcomeValues["status"])}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {["ACTIVE", "TP1_HIT", "TP2_HIT", "TP3_HIT", "STOPPED", "CANCELLED", "CLOSED"].map((status) => (
              <SelectItem key={status} value={status}>
                {status}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {outcomeFields.map((field) => (
          <div key={field.key} className="flex items-center justify-between rounded-2xl border border-border px-4 py-3">
            <div>
              <p className="text-sm font-medium">{field.label}</p>
              <p className="text-xs text-muted-foreground">
                Use this to power member alerts and the desk track record.
              </p>
            </div>
            <Switch
              checked={form.watch(field.key)}
              onCheckedChange={(checked) =>
                form.setValue(field.key, checked, {
                  shouldDirty: true,
                  shouldTouch: true,
                })
              }
            />
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <Label>Final Result (R)</Label>
        <Input
          type="number"
          step="any"
          placeholder="Example: 2 or -1"
          {...form.register("finalPnlR", {
            setValueAs: (value) => (value === "" ? undefined : Number(value)),
          })}
        />
        <p className="text-xs text-muted-foreground">
          Set the final result in R multiples when the trade is fully closed.
        </p>
      </div>

      <div className="space-y-2">
        <Label>Outcome Note</Label>
        <Textarea
          placeholder="Add execution context, partials taken, or how the setup ended."
          {...form.register("outcomeNote")}
        />
      </div>

      <Button disabled={isSubmitting}>
        {isSubmitting ? "Saving..." : "Save outcome"}
      </Button>
    </form>
  );
}
