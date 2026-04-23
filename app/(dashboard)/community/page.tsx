import Link from "next/link";
import { AnnouncementFeed } from "@/components/community/AnnouncementFeed";
import { MonthlySnapshotGrid } from "@/components/community/MonthlySnapshotGrid";
import { WeeklyRecapCard } from "@/components/community/WeeklyRecapCard";
import { RecapArchive } from "@/components/community/RecapArchive";
import { WinsFeedClient } from "@/components/community/WinsFeedClient";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getMonthlySnapshot } from "@/lib/calculations";

export default async function CommunityPage() {
  const user = await requireUser();
  const [announcements, wins, recaps, trades] = await Promise.all([
    prisma.announcement.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.memberWin.findMany({
      where: { isApproved: true },
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            name: true,
            avatarUrl: true,
          },
        },
      },
      take: 30,
    }),
    prisma.weeklyRecap.findMany({
      orderBy: { weekStartDate: "desc" },
    }),
    prisma.trade.findMany({
      where: { userId: user.id },
      select: { tradeDate: true, pnlPercent: true },
      orderBy: { tradeDate: "desc" },
    }),
  ]);

  const [latestRecap, ...pastRecaps] = recaps;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Community"
        title="Desk Activity"
        description="Announcements, member wins, weekly recap, and your full-year snapshot."
        action={
          <Button asChild variant="outline">
            <Link href="/community/leaderboard">View leaderboard</Link>
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.45fr_1fr]">
        <div className="space-y-6">
          <AnnouncementFeed announcements={announcements} />
          <WinsFeedClient
            initialWins={wins}
            userId={user.id}
            userName={user.name ?? ""}
            userAvatarUrl={user.avatarUrl ?? null}
          />
        </div>
        <div className="space-y-6">
          <WeeklyRecapCard recap={latestRecap ?? null} />
          {pastRecaps.length > 0 && <RecapArchive recaps={pastRecaps} />}
          <div className="surface-card p-6">
            <h2 className="text-lg font-semibold">Monthly Snapshot</h2>
            <div className="mt-4">
              <MonthlySnapshotGrid snapshot={getMonthlySnapshot(trades)} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
