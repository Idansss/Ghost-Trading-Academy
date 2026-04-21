"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function ResourceFilters({
  value,
  onValueChange,
}: {
  value: string;
  onValueChange: (value: string) => void;
}) {
  return (
    <Tabs value={value} onValueChange={onValueChange}>
      <TabsList>
        {["ALL", "PDF", "VIDEO", "GUIDE"].map((item) => (
          <TabsTrigger key={item} value={item}>
            {item === "ALL" ? "All" : `${item}s`}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
