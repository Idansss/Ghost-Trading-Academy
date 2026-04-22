"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPercent } from "@/lib/utils";

export function MonthlyPnlChart({
  data,
}: {
  data: Array<{ month: string; pnl: number }>;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Monthly P&amp;L</CardTitle>
      </CardHeader>
      <CardContent className="h-[260px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.15} />
            <XAxis dataKey="month" tickLine={false} axisLine={false} hide />
            <YAxis tickLine={false} axisLine={false} />
            <Tooltip formatter={(value) => formatPercent(Number(value ?? 0))} />
            <Bar dataKey="pnl" radius={[8, 8, 0, 0]} fill="#B8860B" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
