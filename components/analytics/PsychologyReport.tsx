"use client";

import { memo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

type PsychologyData = {
  calmWinRate: number;
  anxiousWinRate: number;
  fearfulWinRate: number;
  avgRFollowedPlan: number;
  avgRNotFollowedPlan: number;
  revengeTradesCount: number;
  revengeTradesPnlImpact: number;
  topEmotionOnWins: string;
  topEmotionOnLosses: string;
  psychologyScore: number;
};

function PsychologyReportComponent({ data }: { data: PsychologyData }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Psychology Report</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-xl border p-3">
            <p className="text-xs text-muted-foreground">Win rate (calm)</p>
            <p className="text-xl font-semibold">{data.calmWinRate.toFixed(1)}%</p>
          </div>
          <div className="rounded-xl border p-3">
            <p className="text-xs text-muted-foreground">Win rate (anxious)</p>
            <p className="text-xl font-semibold">{data.anxiousWinRate.toFixed(1)}%</p>
          </div>
          <div className="rounded-xl border p-3">
            <p className="text-xs text-muted-foreground">Win rate (fearful)</p>
            <p className="text-xl font-semibold">{data.fearfulWinRate.toFixed(1)}%</p>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-xl border p-3">
            <p className="text-xs text-muted-foreground">Avg R when plan followed</p>
            <p className="text-xl font-semibold">{data.avgRFollowedPlan.toFixed(2)}R</p>
          </div>
          <div className="rounded-xl border p-3">
            <p className="text-xs text-muted-foreground">Avg R when plan not followed</p>
            <p className="text-xl font-semibold">{data.avgRNotFollowedPlan.toFixed(2)}R</p>
          </div>
        </div>

        <div className="rounded-xl border p-3">
          <p className="text-sm">
            Revenge trades: <strong>{data.revengeTradesCount}</strong> | Combined PnL impact:{" "}
            <strong>{data.revengeTradesPnlImpact.toFixed(2)}%</strong>
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Most common emotion before wins: {data.topEmotionOnWins}. Before losses: {data.topEmotionOnLosses}.
          </p>
        </div>

        <div className="rounded-xl border p-3">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span>Psychology Score</span>
            <span className="font-semibold">{Math.round(data.psychologyScore)}/100</span>
          </div>
          <Progress value={Math.max(0, Math.min(100, data.psychologyScore))} />
        </div>
      </CardContent>
    </Card>
  );
}

export const PsychologyReport = memo(PsychologyReportComponent);
