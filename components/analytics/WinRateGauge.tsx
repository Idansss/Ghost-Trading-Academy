"use client";

import { RadialBar, RadialBarChart, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function WinRateGauge({
  value,
  title = "Filtered Win Rate",
}: {
  value: number;
  title?: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="h-[260px]">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart
            data={[{ name: "Win Rate", value }]}
            innerRadius="70%"
            outerRadius="100%"
            barSize={18}
            startAngle={180}
            endAngle={0}
          >
            <RadialBar dataKey="value" cornerRadius={12} fill="#B8860B" />
            <text
              x="50%"
              y="58%"
              textAnchor="middle"
              dominantBaseline="middle"
              className="fill-current text-3xl font-semibold"
            >
              {value.toFixed(0)}%
            </text>
          </RadialBarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
