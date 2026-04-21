"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function SignalFilters({
  value,
  onValueChange,
}: {
  value: string;
  onValueChange: (value: string) => void;
}) {
  return (
    <Tabs value={value} onValueChange={onValueChange}>
      <TabsList className="w-full flex-wrap justify-start">
        {["ALL", "ACTIVE", "PENDING", "WIN", "LOSS", "CANCELLED"].map((item) => (
          <TabsTrigger key={item} value={item}>
            {item}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
