"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

export function EquityChart({
  data,
}: {
  data: Array<{ date: string; balance: number }>;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Equity Curve</CardTitle>
      </CardHeader>
      <CardContent className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="equity" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#2D6A0F" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#2D6A0F" stopOpacity={0.04} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.15} />
            <XAxis dataKey="date" tickLine={false} axisLine={false} />
            <YAxis tickFormatter={(value) => `$${Math.round(value / 1000)}k`} tickLine={false} axisLine={false} />
            <Tooltip formatter={(value) => formatCurrency(Number(value ?? 0))} />
            <Area type="monotone" dataKey="balance" stroke="#2D6A0F" fill="url(#equity)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
