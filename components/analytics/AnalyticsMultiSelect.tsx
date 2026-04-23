"use client";

import { Check, ChevronDown, X } from "lucide-react";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export type AnalyticsFilterOption = {
  value: string;
  label: string;
};

export function AnalyticsMultiSelect({
  value,
  options,
  onChange,
  placeholder,
}: {
  value: string[];
  options: AnalyticsFilterOption[];
  onChange: (value: string[]) => void;
  placeholder: string;
}) {
  const [open, setOpen] = useState(false);

  const selectedOptions = useMemo(
    () => options.filter((option) => value.includes(option.value)),
    [options, value],
  );

  const toggle = (nextValue: string) => {
    if (value.includes(nextValue)) {
      onChange(value.filter((entry) => entry !== nextValue));
      return;
    }

    onChange([...value, nextValue]);
  };

  return (
    <div className="space-y-3">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button type="button" variant="outline" className="w-full justify-between">
            <span className={cn("truncate", !selectedOptions.length && "text-muted-foreground")}>
              {selectedOptions.length
                ? `${selectedOptions.length} selected`
                : placeholder}
            </span>
            <ChevronDown className="ml-2 h-4 w-4 shrink-0" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[320px] p-0" align="start">
          <div className="max-h-72 overflow-y-auto p-2">
            {options.length ? (
              options.map((option) => {
                const checked = value.includes(option.value);

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => toggle(option.value)}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition hover:bg-accent"
                  >
                    <Checkbox checked={checked} />
                    <span className="flex-1 text-sm">{option.label}</span>
                    {checked ? <Check className="h-4 w-4 text-primary" /> : null}
                  </button>
                );
              })
            ) : (
              <div className="px-3 py-4 text-sm text-muted-foreground">No options available.</div>
            )}
          </div>
        </PopoverContent>
      </Popover>

      {selectedOptions.length ? (
        <div className="flex flex-wrap gap-2">
          {selectedOptions.map((option) => (
            <Badge key={option.value} variant="muted" className="gap-2 border border-border px-3 py-1">
              {option.label}
              <button
                type="button"
                className="rounded-full text-muted-foreground transition hover:text-foreground"
                onClick={() => toggle(option.value)}
                aria-label={`Remove ${option.label}`}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </Badge>
          ))}
        </div>
      ) : null}
    </div>
  );
}
