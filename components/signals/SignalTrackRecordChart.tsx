"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type EquityPoint = {
  id: string;
  date: string;
  coin: string;
  cumulativeR: number;
  resultR: number;
};

export function SignalTrackRecordChart({ data }: { data: EquityPoint[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Equity Curve</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={data} margin={{ top: 12, right: 12, left: -18, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12 }}
              tickFormatter={(value: string) => format(new Date(value), "MMM d")}
            />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip
              formatter={(value: number, name) => [
                `${Number(value).toFixed(2)}R`,
                name === "cumulativeR" ? "Cumulative R" : "Result",
              ]}
              labelFormatter={(value: string) => format(new Date(value), "PPP")}
            />
            <Line
              type="monotone"
              dataKey="cumulativeR"
              stroke="hsl(var(--primary))"
              strokeWidth={3}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
