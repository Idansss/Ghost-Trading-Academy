"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const resourceTypes = ["ALL", "PDF", "VIDEO", "GUIDE"] as const;

export function ResourceFilters({
  value,
  onValueChange,
}: {
  value: string;
  onValueChange?: (value: string) => void;
}) {
  return (
    <Tabs value={value} onValueChange={onValueChange}>
      <TabsList>
        {resourceTypes.map((item) => (
          <TabsTrigger key={item} value={item}>
            {item === "ALL" ? "All" : `${item}s`}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
