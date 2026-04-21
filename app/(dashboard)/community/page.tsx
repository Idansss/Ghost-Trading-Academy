"use client";

import type { Announcement, MemberWin, WeeklyRecap } from "@prisma/client";
import { useQuery } from "@tanstack/react-query";
import { PageTransition } from "@/components/layout/PageTransition";
import { PageHeader } from "@/components/shared/PageHeader";
import { CommunitySkeleton } from "@/components/skeletons/CommunitySkeleton";
import { AnnouncementFeed } from "@/components/community/AnnouncementFeed";
import { MonthlySnapshotGrid } from "@/components/community/MonthlySnapshotGrid";
import { WeeklyRecapCard } from "@/components/community/WeeklyRecapCard";
import { WinsFeed } from "@/components/community/WinsFeed";
import { ErrorState } from "@/components/ui/ErrorState";
import { fetchJson } from "@/lib/client-api";

export default function CommunityPage() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["community"],
    queryFn: async () => {
      const [announcements, wins, recaps, trades] = await Promise.all([
        fetchJson<{ announcements: Announcement[] }>("/api/announcements"),
        fetchJson<{
          wins: Array<
            MemberWin & { user: { name: string; avatarUrl: string | null } }
          >;
        }>("/api/member-wins"),
        fetchJson<{ recaps: WeeklyRecap[] }>("/api/weekly-recaps"),
        fetchJson<{ summary: { snapshot: Record<string, number> } }>("/api/trades"),
      ]);

      return {
        announcements: announcements.announcements,
        wins: wins.wins,
        recaps: recaps.recaps,
        snapshot: trades.summary.snapshot,
      };
    },
  });

  if (isLoading) {
    return <CommunitySkeleton />;
  }

  if (isError || !data) {
    return (
      <ErrorState
        title="Community unavailable"
        description="The feed could not be loaded right now."
        onRetry={() => {
          void refetch();
        }}
      />
    );
  }

  return (
    <PageTransition>
    <div className="space-y-6">
      <PageHeader
        eyebrow="Community"
        title="Desk Activity"
        description="Announcements, member wins, weekly recap, and your full-year snapshot."
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.45fr_1fr]">
        <div className="space-y-6">
          <AnnouncementFeed announcements={data.announcements} />
          <WinsFeed wins={data.wins} />
        </div>
        <div className="space-y-6">
          <WeeklyRecapCard recap={data.recaps[0] ?? null} />
          <div className="surface-card p-6">
            <h2 className="text-lg font-semibold">Monthly Snapshot</h2>
            <div className="mt-4">
              <MonthlySnapshotGrid snapshot={data.snapshot} />
            </div>
          </div>
        </div>
      </div>
    </div>
    </PageTransition>
  );
}
