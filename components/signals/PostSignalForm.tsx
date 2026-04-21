"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { signalSchema } from "@/lib/validators";

type SignalValues = z.input<typeof signalSchema>;

function getDefaultValues(initialValues?: Partial<SignalValues> | null): SignalValues {
  return {
    coin: initialValues?.coin ?? "BTC/USDT",
    direction: initialValues?.direction ?? "LONG",
    entryZone: initialValues?.entryZone ?? "",
    stopLoss: initialValues?.stopLoss ?? "",
    tp1: initialValues?.tp1 ?? "",
    tp2: initialValues?.tp2 ?? "",
    tp3: initialValues?.tp3 ?? "",
    riskLevel: initialValues?.riskLevel ?? "MEDIUM",
    timeframe: initialValues?.timeframe ?? "4H",
    rrRatio: initialValues?.rrRatio ?? 2,
    reasoning: initialValues?.reasoning ?? "",
    status: initialValues?.status ?? "ACTIVE",
    isVipOnly: initialValues?.isVipOnly ?? true,
  };
}

export function PostSignalForm({
  initialValues,
  onSubmit,
  isSubmitting,
  title = "Post New Signal",
  submitLabel = "Post Signal",
  withCard = true,
}: {
  initialValues?: Partial<SignalValues> | null;
  onSubmit: (values: SignalValues) => Promise<void>;
  isSubmitting?: boolean;
  title?: string;
  submitLabel?: string;
  withCard?: boolean;
}) {
  const form = useForm<SignalValues>({
    resolver: zodResolver(signalSchema),
    defaultValues: getDefaultValues(initialValues),
  });

  useEffect(() => {
    form.reset(getDefaultValues(initialValues));
  }, [form, initialValues]);

  const content = (
    <form
      className="grid grid-cols-1 gap-4 md:grid-cols-2"
      onSubmit={form.handleSubmit(async (values) => {
        await onSubmit(values);
        if (!initialValues) {
          form.reset(getDefaultValues());
        }
      })}
    >
      <div className="space-y-2">
        <Label>Pair</Label>
        <Input {...form.register("coin")} />
      </div>
      <div className="space-y-2">
        <Label>Direction</Label>
        <Select
          value={form.watch("direction")}
          onValueChange={(value) => form.setValue("direction", value as SignalValues["direction"])}
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
        <Label>Entry Zone</Label>
        <Input {...form.register("entryZone")} />
      </div>
      <div className="space-y-2">
        <Label>Stop Loss</Label>
        <Input {...form.register("stopLoss")} />
      </div>
      <div className="space-y-2">
        <Label>TP1</Label>
        <Input {...form.register("tp1")} />
      </div>
      <div className="space-y-2">
        <Label>TP2</Label>
        <Input {...form.register("tp2")} />
      </div>
      <div className="space-y-2">
        <Label>TP3</Label>
        <Input {...form.register("tp3")} />
      </div>
      <div className="space-y-2">
        <Label>R:R</Label>
        <Input
          type="number"
          step="any"
          {...form.register("rrRatio", { valueAsNumber: true })}
        />
      </div>
      <div className="space-y-2">
        <Label>Risk Level</Label>
        <Select
          value={form.watch("riskLevel")}
          onValueChange={(value) => form.setValue("riskLevel", value as SignalValues["riskLevel"])}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {["LOW", "MEDIUM", "HIGH"].map((item) => (
              <SelectItem key={item} value={item}>
                {item}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Timeframe</Label>
        <Input {...form.register("timeframe")} />
      </div>
      <div className="space-y-2">
        <Label>Status</Label>
        <Select
          value={form.watch("status")}
          onValueChange={(value) => form.setValue("status", value as SignalValues["status"])}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {["ACTIVE", "PENDING", "WIN", "LOSS", "CANCELLED", "BREAKEVEN"].map((item) => (
              <SelectItem key={item} value={item}>
                {item}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2 md:col-span-2">
        <Label>Reasoning</Label>
        <Textarea {...form.register("reasoning")} />
      </div>
      <div className="rounded-2xl border border-border px-4 py-3 md:col-span-2">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium">VIP only</p>
            <p className="text-xs text-muted-foreground">
              Restrict the signal to VIP members
            </p>
          </div>
          <Switch
            checked={form.watch("isVipOnly")}
            onCheckedChange={(checked) => form.setValue("isVipOnly", checked)}
          />
        </div>
      </div>
      <div className="md:col-span-2">
        <Button disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : submitLabel}
        </Button>
      </div>
    </form>
  );

  if (!withCard) {
    return content;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>{content}</CardContent>
    </Card>
  );
}
