"use client";

import Link from "next/link";
import { Plus, Settings2 } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { PageTransition } from "@/components/layout/PageTransition";
import { EmptyState } from "@/components/shared/EmptyState";
import { PageHeader } from "@/components/shared/PageHeader";
import { OutlookCard } from "@/components/outlook/OutlookCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useOutlook } from "@/hooks/useOutlook";

export default function OutlookPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const { data, isLoading } = useOutlook(undefined, true);
  const isAdmin = session?.user.role === "ADMIN";

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
              <Button asChild variant="outline">
                <Link href="/admin/outlook">
                  <Settings2 className="mr-2 h-4 w-4" />
                  Manage Outlook
                </Link>
              </Button>
              <Button asChild>
                <Link href="/admin/outlook">
                  <Plus className="mr-2 h-4 w-4" />
                  {data?.outlook ? "Update Outlook" : "Post Outlook"}
                </Link>
              </Button>
            </div>
          ) : null
        }
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
          action={
            isAdmin
              ? {
                  label: "Post today's outlook",
                  onClick: () => router.push("/admin/outlook"),
                }
              : undefined
          }
        />
      )}
    </div>
    </PageTransition>
  );
}
