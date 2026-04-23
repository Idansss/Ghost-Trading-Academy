"use client";

import { useQuery } from "@tanstack/react-query";
import { Trophy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { fetchJson } from "@/lib/client-api";

type SignalStatsResponse = {
  totalSignals: number;
  winRate: number;
  fullTp3Rate: number;
  avgR: number;
  winStreak: number;
  lossStreak: number;
};

export function SignalsWinRateBadge() {
  const { data } = useQuery({
    queryKey: ["signal-stats"],
    queryFn: () => fetchJson<SignalStatsResponse>("/api/signals/stats"),
  });

  if (!data || data.totalSignals === 0) {
    return (
      <Badge variant="muted">
        <Trophy className="h-3.5 w-3.5" />
        No closed signals yet
      </Badge>
    );
  }

  return (
    <Badge variant="success">
      <Trophy className="h-3.5 w-3.5" />
      Win Rate {data.winRate.toFixed(1)}%
    </Badge>
  );
}
