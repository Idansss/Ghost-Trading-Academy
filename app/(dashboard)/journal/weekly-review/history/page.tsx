"use client";

import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchJson } from "@/lib/client-api";

type WeeklyReview = {
  id: string;
  weekStartDate: string;
  totalTrades: number;
  winRate: number;
  totalPnl: number;
  totalR: number;
  disciplineScore: number;
  nextWeekFocus: string;
  createdAt: string;
};

export default function WeeklyReviewHistoryPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["weekly-review-history"],
    queryFn: () => fetchJson<{ reviews: WeeklyReview[] }>("/api/journal/weekly-review/history"),
  });

  if (isLoading) {
    return <div>Loading history...</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Weekly Review History</h1>
      <div className="space-y-3">
        {data?.reviews.map((review) => (
          <Card key={review.id}>
            <CardHeader>
              <CardTitle>{format(new Date(review.weekStartDate), "MMM d, yyyy")}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2 text-sm md:grid-cols-3">
              <p>Trades: {review.totalTrades}</p>
              <p>Win Rate: {review.winRate.toFixed(1)}%</p>
              <p>Total PnL: {review.totalPnl.toFixed(2)}%</p>
              <p>Total R: {review.totalR.toFixed(2)}R</p>
              <p>Discipline: {review.disciplineScore}/100</p>
              <p>Focus: {review.nextWeekFocus}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
