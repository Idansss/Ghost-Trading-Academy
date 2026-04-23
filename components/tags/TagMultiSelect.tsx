"use client";

import { Check, ChevronDown, X } from "lucide-react";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export type TagOption = {
  id: string;
  name: string;
  color: string;
};

export function TagMultiSelect({
  value,
  options,
  onChange,
  placeholder = "Select tags",
}: {
  value: string[];
  options: TagOption[];
  onChange: (value: string[]) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);

  const selectedOptions = useMemo(
    () => options.filter((option) => value.includes(option.name)),
    [options, value],
  );

  const toggle = (tagName: string) => {
    if (value.includes(tagName)) {
      onChange(value.filter((entry) => entry !== tagName));
      return;
    }

    onChange([...value, tagName]);
  };

  return (
    <div className="space-y-3">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button type="button" variant="outline" className="w-full justify-between">
            <span className={cn("truncate", !selectedOptions.length && "text-muted-foreground")}>
              {selectedOptions.length
                ? `${selectedOptions.length} tag${selectedOptions.length > 1 ? "s" : ""} selected`
                : placeholder}
            </span>
            <ChevronDown className="ml-2 h-4 w-4 shrink-0" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[320px] p-0" align="start">
          <div className="max-h-72 overflow-y-auto p-2">
            {options.length ? (
              options.map((option) => {
                const checked = value.includes(option.name);

                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => toggle(option.name)}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition hover:bg-accent"
                  >
                    <Checkbox checked={checked} />
                    <span
                      className="h-3 w-3 rounded-full border border-border"
                      style={{ backgroundColor: option.color }}
                    />
                    <span className="flex-1 text-sm">{option.name}</span>
                    {checked ? <Check className="h-4 w-4 text-primary" /> : null}
                  </button>
                );
              })
            ) : (
              <div className="px-3 py-4 text-sm text-muted-foreground">No tags available yet.</div>
            )}
          </div>
        </PopoverContent>
      </Popover>

      {selectedOptions.length ? (
        <div className="flex flex-wrap gap-2">
          {selectedOptions.map((option) => (
            <Badge
              key={option.id}
              variant="muted"
              className="gap-2 border border-border px-3 py-1"
            >
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: option.color }}
              />
              {option.name}
              <button
                type="button"
                className="rounded-full text-muted-foreground transition hover:text-foreground"
                onClick={() => toggle(option.name)}
                aria-label={`Remove ${option.name}`}
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
