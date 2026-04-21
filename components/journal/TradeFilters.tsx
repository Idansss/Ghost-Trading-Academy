"use client";

import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export interface TradeFilterState {
  search: string;
  outcome: string;
  direction: string;
  setup: string;
  from: string;
  to: string;
}

export function TradeFilters({
  value,
  onChange,
}: {
  value: TradeFilterState;
  onChange: (value: TradeFilterState) => void;
}) {
  return (
    <div className="grid gap-3 lg:grid-cols-5">
      <Input
        placeholder="Search pair"
        value={value.search}
        onChange={(event) => onChange({ ...value, search: event.target.value })}
      />
      <Select
        value={value.outcome}
        onValueChange={(next) => onChange({ ...value, outcome: next })}
      >
        <SelectTrigger>
          <SelectValue placeholder="Outcome" />
        </SelectTrigger>
        <SelectContent>
          {["ALL", "WIN", "LOSS", "BREAKEVEN", "PENDING", "CANCELLED"].map((item) => (
            <SelectItem key={item} value={item}>
              {item}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={value.direction}
        onValueChange={(next) => onChange({ ...value, direction: next })}
      >
        <SelectTrigger>
          <SelectValue placeholder="Direction" />
        </SelectTrigger>
        <SelectContent>
          {["ALL", "LONG", "SHORT"].map((item) => (
            <SelectItem key={item} value={item}>
              {item}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Input
        placeholder="Setup type"
        value={value.setup}
        onChange={(event) => onChange({ ...value, setup: event.target.value })}
      />
      <div className="grid grid-cols-2 gap-3">
        <Input
          type="date"
          value={value.from}
          onChange={(event) => onChange({ ...value, from: event.target.value })}
        />
        <Input
          type="date"
          value={value.to}
          onChange={(event) => onChange({ ...value, to: event.target.value })}
        />
      </div>
    </div>
  );
}
