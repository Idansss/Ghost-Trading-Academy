"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MONTH_NAMES } from "@/lib/constants";

export function MonthSelector({
  value,
  onValueChange,
}: {
  value: string;
  onValueChange: (value: string) => void;
}) {
  const year = new Date().getFullYear();

  return (
    <Tabs value={value} onValueChange={onValueChange}>
      <TabsList className="w-full flex-wrap justify-start">
        {MONTH_NAMES.map((month) => (
          <TabsTrigger key={month} value={`${month}_${year}`}>
            {month}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
