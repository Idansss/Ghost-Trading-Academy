import type { Trade } from "@prisma/client";
import { format } from "date-fns";
import { BookOpenText } from "lucide-react";
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
        {/* AUDIT FIX: Added empty state — previously rendered a blank table with no
            heading or message when there were no trades to display. */}
        {trades.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 px-6 py-10 text-center text-muted-foreground">
            <BookOpenText className="h-8 w-8 opacity-40" />
            <p className="text-sm">No trades logged yet. Head to the Journal to add your first trade.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
          <div className="min-w-max px-6 pb-6">
          <Table className="min-w-[480px] w-full">
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Pair</TableHead>
                <TableHead>Outcome</TableHead>
                <TableHead>P&amp;L</TableHead>
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
        )}
      </CardContent>
    </Card>
  );
}
