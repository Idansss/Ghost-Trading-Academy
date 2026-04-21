"use client";

import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function PerformanceCharts({
  monthlyRows,
  equityCurve,
  winLossData,
  setupData,
}: {
  monthlyRows: Array<{ month: string; pnl: number }>;
  equityCurve: Array<{ date: string; balance: number }>;
  winLossData: Array<{ name: string; value: number; fill: string }>;
  setupData: Array<{ setup: string; winRate: number }>;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Monthly P&L</CardTitle>
        </CardHeader>
        <CardContent className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyRows}>
              <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.15} />
              <XAxis dataKey="month" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} />
              <Tooltip />
              <Bar dataKey="pnl" radius={[8, 8, 0, 0]}>
                {monthlyRows.map((row) => (
                  <Cell key={row.month} fill={row.pnl >= 0 ? "#2D6A0F" : "#8B2020"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Cumulative Equity Growth</CardTitle>
        </CardHeader>
        <CardContent className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={equityCurve}>
              <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.15} />
              <XAxis dataKey="date" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} />
              <Tooltip />
              <Line dataKey="balance" type="monotone" stroke="#B8860B" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Win / Loss Distribution</CardTitle>
        </CardHeader>
        <CardContent className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={winLossData} dataKey="value" nameKey="name" innerRadius={68} outerRadius={94} paddingAngle={4} />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Setup Performance</CardTitle>
        </CardHeader>
        <CardContent className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={setupData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.15} />
              <XAxis type="number" tickLine={false} axisLine={false} />
              <YAxis type="category" dataKey="setup" tickLine={false} axisLine={false} width={110} />
              <Tooltip />
              <Bar dataKey="winRate" fill="#0E4F8A" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
