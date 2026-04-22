import type { Trade } from "@prisma/client";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatPercent } from "@/lib/utils";

export function RecentTradesTable({ trades }: { trades: Trade[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Trades</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
        <div className="min-w-max px-6 pb-6">
        <Table className="min-w-[480px] w-full">
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Pair</TableHead>
              <TableHead>Outcome</TableHead>
              <TableHead>P&L</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {trades.map((trade) => (
              <TableRow key={trade.id}>
                <TableCell>{format(new Date(trade.tradeDate), "MMM d")}</TableCell>
                <TableCell>{trade.coin}</TableCell>
                <TableCell>
                  <Badge
                    variant={
                      trade.outcome === "WIN"
                        ? "success"
                        : trade.outcome === "LOSS"
                          ? "danger"
                          : trade.outcome === "PENDING"
                            ? "warning"
                            : "muted"
                    }
                  >
                    <span className="status-dot bg-current" />
                    {trade.outcome}
                  </Badge>
                </TableCell>
                <TableCell className={trade.pnlPercent >= 0 ? "text-[color:var(--color-green)]" : "text-[color:var(--color-red)]"}>
                  {formatPercent(trade.pnlPercent)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        </div>
        </div>
      </CardContent>
    </Card>
  );
}
