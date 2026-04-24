"use client";

import { Plus, Settings2 } from "lucide-react";
import { useSession } from "next-auth/react";
import { OutlookEditor } from "@/components/admin/OutlookEditor";
import { PageTransition } from "@/components/layout/PageTransition";
import { EmptyState } from "@/components/shared/EmptyState";
import { PageHeader } from "@/components/shared/PageHeader";
import { OutlookCard } from "@/components/outlook/OutlookCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useOutlook } from "@/hooks/useOutlook";

export default function OutlookPage() {
  const { data: session } = useSession();
  const { data, isLoading } = useOutlook(undefined, true);
  const isAdmin = session?.user.role === "ADMIN";

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <PageTransition>
    <div className="space-y-6">
      <PageHeader
        eyebrow="Daily Outlook"
        title="Market Bias And Levels"
        description="Start the session with the desk bias, the coins in focus, and the levels that matter."
        action={
          isAdmin ? (
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => scrollToSection("outlook-admin-desk")}>
                <Settings2 className="mr-2 h-4 w-4" />
                Manage Outlook
              </Button>
              <Button onClick={() => scrollToSection("outlook-admin-desk")}>
                <Plus className="mr-2 h-4 w-4" />
                {data?.outlook ? "Update Outlook" : "Post Outlook"}
              </Button>
            </div>
          ) : null
        }
      />

      {isAdmin ? (
        <OutlookEditor
          title={data?.outlook ? "Update Today's Outlook" : "Post Today's Outlook"}
          description="Publish the desk bias and key levels directly from the live outlook page."
          redirectTo={null}
        />
      ) : null}

      {isLoading ? (
        <Skeleton className="h-[560px] w-full" />
      ) : data?.outlook ? (
        <OutlookCard
          outlook={{
            ...data.outlook,
            chartImageUrl: data.outlook.chartImageUrl ?? null,
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
          action={
            isAdmin
              ? {
                  label: "Post today's outlook",
                  onClick: () => scrollToSection("outlook-admin-desk"),
                }
              : undefined
          }
        />
      )}
    </div>
    </PageTransition>
  );
}
