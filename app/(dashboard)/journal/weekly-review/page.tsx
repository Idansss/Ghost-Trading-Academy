"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { fetchJson } from "@/lib/client-api";

type ReviewPayload = {
  weekStartDate: string;
  stats: {
    totalTrades: number;
    winRate: number;
    totalPnl: number;
    totalR: number;
    disciplineScore: number;
  };
  bestTrades: Array<{ id: string; coin: string; pnlPercent: number; outcome: string; setupType: string }>;
  worstTrades: Array<{ id: string; coin: string; pnlPercent: number; outcome: string; setupType: string }>;
  existingReview: {
    bestTrade: string | null;
    worstTrade: string | null;
    whatWorked: string;
    whatDidntWork: string;
    nextWeekFocus: string;
    overallRating: number;
  } | null;
};

export default function WeeklyReviewPage() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["weekly-review-current"],
    queryFn: () => fetchJson<ReviewPayload>("/api/journal/weekly-review"),
  });

  const [whatWorked, setWhatWorked] = useState("");
  const [whatDidntWork, setWhatDidntWork] = useState("");
  const [nextWeekFocus, setNextWeekFocus] = useState("");
  const [bestTrade, setBestTrade] = useState<string | null>(null);
  const [worstTrade, setWorstTrade] = useState<string | null>(null);
  const [overallRating, setOverallRating] = useState(3);

  const submit = useMutation({
    mutationFn: () =>
      fetchJson("/api/journal/weekly-review", {
        method: "POST",
        body: JSON.stringify({
          weekStartDate: data?.weekStartDate,
          bestTrade,
          worstTrade,
          whatWorked,
          whatDidntWork,
          nextWeekFocus,
          overallRating,
        }),
      }),
    onSuccess: async () => {
      toast.success("Weekly review saved.");
      await queryClient.invalidateQueries({ queryKey: ["weekly-review-current"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  if (isLoading || !data) {
    return <div className="space-y-4">Loading weekly review...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Weekly Trade Review</h1>
        <Button variant="outline" asChild>
          <a href="/journal/weekly-review/history">View History</a>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            Week of {format(new Date(data.weekStartDate), "MMM d, yyyy")}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div className="rounded-xl border p-3">
            <p className="text-xs text-muted-foreground">Trades</p>
            <p className="text-xl font-semibold">{data.stats.totalTrades}</p>
          </div>
          <div className="rounded-xl border p-3">
            <p className="text-xs text-muted-foreground">Win rate</p>
            <p className="text-xl font-semibold">{data.stats.winRate.toFixed(1)}%</p>
          </div>
          <div className="rounded-xl border p-3">
            <p className="text-xs text-muted-foreground">Total PnL</p>
            <p className="text-xl font-semibold">{data.stats.totalPnl.toFixed(2)}%</p>
          </div>
          <div className="rounded-xl border p-3">
            <p className="text-xs text-muted-foreground">Total R</p>
            <p className="text-xl font-semibold">{data.stats.totalR.toFixed(2)}R</p>
          </div>
          <div className="rounded-xl border p-3">
            <p className="text-xs text-muted-foreground">Discipline Score</p>
            <p className="text-xl font-semibold">{data.stats.disciplineScore}/100</p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Best Trades (select one)</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {data.bestTrades.map((trade) => (
              <button
                key={trade.id}
                className={`w-full rounded-xl border p-3 text-left ${bestTrade === trade.id ? "border-primary bg-primary/10" : ""}`}
                onClick={() => setBestTrade(trade.id)}
              >
                {trade.coin} - {trade.pnlPercent.toFixed(2)}% ({trade.setupType})
              </button>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Worst Trades (select one)</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {data.worstTrades.map((trade) => (
              <button
                key={trade.id}
                className={`w-full rounded-xl border p-3 text-left ${worstTrade === trade.id ? "border-primary bg-primary/10" : ""}`}
                onClick={() => setWorstTrade(trade.id)}
              >
                {trade.coin} - {trade.pnlPercent.toFixed(2)}% ({trade.setupType})
              </button>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Reflection</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>What worked this week?</Label>
            <Textarea value={whatWorked} onChange={(event) => setWhatWorked(event.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>What didn&apos;t work this week?</Label>
            <Textarea value={whatDidntWork} onChange={(event) => setWhatDidntWork(event.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Single focus for next week</Label>
            <Textarea value={nextWeekFocus} onChange={(event) => setNextWeekFocus(event.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Overall rating (1-5)</Label>
            <Input type="number" min={1} max={5} value={overallRating} onChange={(event) => setOverallRating(Number(event.target.value || 1))} />
          </div>
          <Button disabled={submit.isPending} onClick={() => submit.mutate()}>
            {submit.isPending ? "Saving..." : "Save Weekly Review"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
