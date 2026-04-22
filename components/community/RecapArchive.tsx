"use client";

import type { WeeklyRecap } from "@prisma/client";
import { ChevronDown, ChevronUp, TrendingUp } from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatPercent } from "@/lib/utils";

export function RecapArchive({ recaps }: { recaps: WeeklyRecap[] }) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? recaps : recaps.slice(0, 3);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          Past Recaps
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {visible.map((recap) => (
          <div
            key={recap.id}
            className="flex items-center justify-between rounded-2xl border border-border px-4 py-3"
          >
            <div className="min-w-0">
              <p className="text-sm font-medium">
                {format(new Date(recap.weekStartDate), "MMM d")} –{" "}
                {format(new Date(recap.weekEndDate), "MMM d, yyyy")}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {recap.totalTrades} trades · {recap.winRate.toFixed(0)}% win rate
              </p>
            </div>
            <Badge
              variant={recap.totalPnlPercent >= 0 ? "success" : "danger"}
              className="ml-3 shrink-0"
            >
              {formatPercent(recap.totalPnlPercent)}
            </Badge>
          </div>
        ))}

        {recaps.length > 3 && (
          <Button
            type="button"
            variant="ghost"
            className="w-full gap-2 text-sm text-muted-foreground"
            onClick={() => setExpanded((v) => !v)}
          >
            {expanded ? (
              <>
                <ChevronUp className="h-4 w-4" />
                Show less
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4" />
                View all {recaps.length} recaps
              </>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
