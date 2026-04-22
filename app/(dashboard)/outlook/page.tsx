"use client";

import { PageTransition } from "@/components/layout/PageTransition";
import { EmptyState } from "@/components/shared/EmptyState";
import { PageHeader } from "@/components/shared/PageHeader";
import { OutlookCard } from "@/components/outlook/OutlookCard";
import { Skeleton } from "@/components/ui/skeleton";
import { useOutlook } from "@/hooks/useOutlook";

export default function OutlookPage() {
  const { data, isLoading } = useOutlook(undefined, true);

  return (
    <PageTransition>
    <div className="space-y-6">
      <PageHeader
        eyebrow="Daily Outlook"
        title="Market Bias And Levels"
        description="Start the session with the desk bias, the coins in focus, and the levels that matter."
      />

      {isLoading ? (
        <Skeleton className="h-[560px] w-full" />
      ) : data?.outlook ? (
        <OutlookCard
          outlook={{
            ...data.outlook,
            coinsToWatch: data.outlook.coinsToWatch as Array<{ coin: string; note: string }>,
            levels: data.outlook.levels as Array<{
              coin: string;
              resistance: string;
              support: string;
            }>,
            avoidToday: data.outlook.avoidToday as string[],
          }}
        />
      ) : (
        <EmptyState
          title="No outlook posted yet. Check back soon."
          description="The daily market briefing will appear here once the admin posts it."
        />
      )}
    </div>
    </PageTransition>
  );
}
