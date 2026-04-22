"use client";

import { useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const signalStatuses = ["ALL", "ACTIVE", "PENDING", "WIN", "LOSS", "CANCELLED"] as const;

export function SignalFilters({ value }: { value: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const handleValueChange = (nextValue: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (nextValue === "ALL") {
      params.delete("status");
    } else {
      params.set("status", nextValue);
    }

    const query = params.toString();
    startTransition(() => {
      router.replace(query ? `${pathname}?${query}` : pathname);
    });
  };

  return (
    <Tabs value={value} onValueChange={handleValueChange}>
      <TabsList className="w-full flex-wrap justify-start">
        {signalStatuses.map((item) => (
          <TabsTrigger key={item} value={item}>
            {item}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
