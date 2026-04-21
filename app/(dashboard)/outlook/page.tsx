"use client";

import { useSession } from "next-auth/react";
import { PageTransition } from "@/components/layout/PageTransition";
import { EmptyState } from "@/components/shared/EmptyState";
import { PageHeader } from "@/components/shared/PageHeader";
import { VipGate } from "@/components/shared/VipGate";
import { OutlookCard } from "@/components/outlook/OutlookCard";
import { Skeleton } from "@/components/ui/skeleton";
import { useOutlook } from "@/hooks/useOutlook";

export default function OutlookPage() {
  const { data: session } = useSession();
  const gated = session?.user.role === "MEMBER";
  const { data, isLoading } = useOutlook(undefined, !gated);

  const previewOutlook = {
    id: "preview",
    date: new Date(),
    marketBias: "RANGING" as const,
    biasExplanation:
      "Today's full bias, key levels, and desk notes are available to VIP members.",
    coinsToWatch: [
      { coin: "BTC/USDT", note: "Unlock the live watchlist and execution notes." },
      { coin: "ETH/USDT", note: "Premium levels and context are hidden for members." },
    ],
    levels: [
      { coin: "BTC", resistance: "Locked", support: "Locked" },
      { coin: "ETH", resistance: "Locked", support: "Locked" },
    ],
    avoidToday: ["Upgrade to see today's avoid list and risk notes."],
    createdBy: "preview",
    createdAt: new Date(),
  };

  return (
    <PageTransition>
    <div className="space-y-6">
      <PageHeader
        eyebrow="Daily Outlook"
        title="Market Bias And Levels"
        description="Start the session with the desk bias, the coins in focus, and the levels that matter."
      />

      {gated ? (
        <VipGate enabled>
          <OutlookCard outlook={previewOutlook} />
        </VipGate>
      ) : isLoading ? (
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
