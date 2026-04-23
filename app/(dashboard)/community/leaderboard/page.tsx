"use client";

import { Crown, Medal, Trophy } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { PageTransition } from "@/components/layout/PageTransition";
import { Breadcrumb } from "@/components/shared/Breadcrumb";
import { PageHeader } from "@/components/shared/PageHeader";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ErrorState } from "@/components/ui/ErrorState";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { fetchJson } from "@/lib/client-api";

type LeaderboardRow = {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  winRate: number;
  totalTrades: number;
  avgR: number;
  currentStreak: number;
  rank: number;
};

type LeaderboardResponse = {
  timeframe: "month" | "all";
  top: LeaderboardRow[];
  currentUser: LeaderboardRow | null;
  currentUserEligible: boolean;
};

const podiumIcons = [Crown, Trophy, Medal];

function initials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function LeaderboardTabs({ value }: { value: "month" | "all" }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return (
    <Tabs
      value={value}
      onValueChange={(nextValue) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("timeframe", nextValue);
        router.replace(`${pathname}?${params.toString()}`);
      }}
    >
      <TabsList>
        <TabsTrigger value="month">This Month</TabsTrigger>
        <TabsTrigger value="all">All Time</TabsTrigger>
      </TabsList>
    </Tabs>
  );
}

export default function CommunityLeaderboardPage() {
  const searchParams = useSearchParams();
  const timeframe = searchParams.get("timeframe") === "month" ? "month" : "all";

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["leaderboard", timeframe],
    queryFn: () =>
      fetchJson<LeaderboardResponse>(`/api/leaderboard?timeframe=${timeframe}`),
  });

  if (isError) {
    return (
      <ErrorState
        title="Leaderboard unavailable"
        description="There was a problem loading the member rankings."
        onRetry={() => {
          void refetch();
        }}
      />
    );
  }

  if (isLoading || !data) {
    return <Skeleton className="h-[360px] w-full" />;
  }

  const podium = data.top.slice(0, 3);
  const rest = data.top.slice(3);

  return (
    <PageTransition>
      <div className="space-y-6">
        <Breadcrumb
          items={[
            { label: "Dashboard", href: "/dashboard" },
            { label: "Community", href: "/community" },
            { label: "Leaderboard" },
          ]}
        />
        <PageHeader
          eyebrow="Community"
          title="Member Leaderboard"
          description="Ranked by win rate with a minimum of 10 closed trades. No raw PnL is shown."
          action={<LeaderboardTabs value={timeframe} />}
        />

        {podium.length ? (
          <div className="grid gap-4 lg:grid-cols-3">
            {podium.map((member, index) => {
              const Icon = podiumIcons[index] ?? Trophy;

              return (
                <Card
                  key={member.userId}
                  className={index === 0 ? "border-primary/40 bg-primary/5 lg:-translate-y-2" : ""}
                >
                  <CardContent className="space-y-4 p-6">
                    <div className="flex items-center justify-between">
                      <Badge variant={index === 0 ? "default" : "muted"}>#{member.rank}</Badge>
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex items-center gap-4">
                      <Avatar className="h-14 w-14 border border-border">
                        <AvatarImage src={member.avatarUrl ?? undefined} alt={member.displayName} />
                        <AvatarFallback>{initials(member.displayName)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold">{member.displayName}</p>
                        <p className="text-sm text-muted-foreground">{member.totalTrades} trades</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3 text-sm">
                      <div>
                        <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Win Rate</p>
                        <p className="mt-1 font-semibold">{member.winRate.toFixed(1)}%</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Avg R</p>
                        <p className="mt-1 font-semibold">{member.avgR.toFixed(2)}R</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Streak</p>
                        <p className="mt-1 font-semibold">{member.currentStreak}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="p-8 text-center text-sm text-muted-foreground">
              No members qualify for the leaderboard yet. Members need to opt in and log at least 10 closed trades.
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Rankings</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rank</TableHead>
                  <TableHead>Member</TableHead>
                  <TableHead>Win Rate</TableHead>
                  <TableHead>Trades</TableHead>
                  <TableHead>Avg R</TableHead>
                  <TableHead>Streak</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rest.map((member) => (
                  <TableRow key={member.userId}>
                    <TableCell>#{member.rank}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 border border-border">
                          <AvatarImage src={member.avatarUrl ?? undefined} alt={member.displayName} />
                          <AvatarFallback>{initials(member.displayName)}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{member.displayName}</span>
                      </div>
                    </TableCell>
                    <TableCell>{member.winRate.toFixed(1)}%</TableCell>
                    <TableCell>{member.totalTrades}</TableCell>
                    <TableCell>{member.avgR.toFixed(2)}R</TableCell>
                    <TableCell>{member.currentStreak}</TableCell>
                  </TableRow>
                ))}
                {rest.length === 0 && podium.length === 0 ? null : null}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle>Your Rank</CardTitle>
          </CardHeader>
          <CardContent>
            {data.currentUser ? (
              <div className="grid gap-4 md:grid-cols-[0.9fr_1.2fr_0.9fr_0.9fr_0.9fr] md:items-center">
                <div>
                  <p className="text-sm text-muted-foreground">Rank</p>
                  <p className="text-3xl font-semibold">#{data.currentUser.rank}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12 border border-border">
                    <AvatarImage src={data.currentUser.avatarUrl ?? undefined} alt={data.currentUser.displayName} />
                    <AvatarFallback>{initials(data.currentUser.displayName)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">{data.currentUser.displayName}</p>
                    <p className="text-sm text-muted-foreground">{data.currentUser.totalTrades} trades</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Win Rate</p>
                  <p className="text-lg font-semibold">{data.currentUser.winRate.toFixed(1)}%</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Avg R</p>
                  <p className="text-lg font-semibold">{data.currentUser.avgR.toFixed(2)}R</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Streak</p>
                  <p className="text-lg font-semibold">{data.currentUser.currentStreak}</p>
                </div>
              </div>
            ) : data.currentUserEligible ? (
              <p className="text-sm text-muted-foreground">
                Your rank will appear here once you meet the minimum trade threshold.
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                You are not currently eligible for the leaderboard. Opt in from profile settings and maintain at least 10 closed trades.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </PageTransition>
  );
}
