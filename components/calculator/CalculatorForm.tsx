"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { CalculatorInput } from "@/hooks/useCalculator";

export function CalculatorForm({
  value,
  onChange,
}: {
  value: CalculatorInput;
  onChange: (value: CalculatorInput) => void;
}) {
  return (
    <div className="grid gap-4">
      {[
        { key: "balance", label: "Account Balance ($)" },
        { key: "riskPercent", label: "Risk Per Trade (%)" },
        { key: "entry", label: "Entry Price" },
        { key: "stopLoss", label: "Stop Loss Price" },
        { key: "takeProfit", label: "Take Profit Price" },
      ].map((field) => (
        <div key={field.key} className="space-y-2">
          <Label htmlFor={field.key}>{field.label}</Label>
          <Input
            id={field.key}
            type="number"
            step="any"
            value={value[field.key as keyof CalculatorInput]}
            onChange={(event) => {
              const nextValue = event.target.value;
              onChange({
                ...value,
                [field.key]: nextValue === "" ? "" : Number(nextValue),
              });
            }}
          />
        </div>
      ))}
    </div>
  );
}
