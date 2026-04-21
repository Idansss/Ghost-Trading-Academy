import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatPercent } from "@/lib/utils";

export interface MonthlyRow {
  month: string;
  trades: number;
  wins: number;
  losses: number;
  winRate: number;
  pnl: number;
}

export function MonthlyTable({
  rows,
  currentMonth,
}: {
  rows: MonthlyRow[];
  currentMonth: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Monthly Performance</CardTitle>
      </CardHeader>
      <CardContent>
        <Table className="min-w-[640px] w-full">
          <TableHeader>
            <TableRow>
              <TableHead>Month</TableHead>
              <TableHead>Trades</TableHead>
              <TableHead>Wins</TableHead>
              <TableHead>Losses</TableHead>
              <TableHead>Win Rate</TableHead>
              <TableHead>P&L %</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.month} className={row.month === currentMonth ? "bg-primary/5" : undefined}>
                <TableCell>{row.month}</TableCell>
                <TableCell>{row.trades}</TableCell>
                <TableCell>{row.wins}</TableCell>
                <TableCell>{row.losses}</TableCell>
                <TableCell>
                  <div className="space-y-2">
                    <span>{row.winRate.toFixed(1)}%</span>
                    <Progress value={row.winRate} />
                  </div>
                </TableCell>
                <TableCell className={row.pnl >= 0 ? "text-[color:var(--color-green)]" : "text-[color:var(--color-red)]"}>
                  {formatPercent(row.pnl)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
