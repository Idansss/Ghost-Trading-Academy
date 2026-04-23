"use client";

import type { Trade } from "@prisma/client";
import { format } from "date-fns";
import { ImageIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn, formatPercent } from "@/lib/utils";

type SortKey =
  | "tradeDate"
  | "coin"
  | "direction"
  | "entryPrice"
  | "rrRatio"
  | "outcome"
  | "pnlPercent";

type SortState = {
  key: SortKey | null;
  direction: "asc" | "desc" | null;
};

const sortableColumns: Array<{ key: SortKey; label: string }> = [
  { key: "tradeDate", label: "Date" },
  { key: "coin", label: "Pair" },
  { key: "direction", label: "Direction" },
  { key: "entryPrice", label: "Entry" },
  { key: "rrRatio", label: "R:R" },
  { key: "outcome", label: "Outcome" },
  { key: "pnlPercent", label: "P&L %" },
];

export function TradeTable({
  trades,
  onRowClick,
}: {
  trades: Trade[];
  onRowClick: (trade: Trade) => void;
}) {
  const [sort, setSort] = useState<SortState>({
    key: null,
    direction: null,
  });

  const sortedTrades = useMemo(() => {
    const baseTrades = [...trades];
    const sortKey = sort.key;
    const sortDirection = sort.direction;

    if (!sortKey || !sortDirection) {
      return baseTrades.sort(
        (left, right) =>
          new Date(right.tradeDate).getTime() - new Date(left.tradeDate).getTime(),
      );
    }

    return baseTrades.sort((left, right) => {
      const leftValue = left[sortKey];
      const rightValue = right[sortKey];

      if (typeof leftValue === "number" && typeof rightValue === "number") {
        return sortDirection === "asc"
          ? leftValue - rightValue
          : rightValue - leftValue;
      }

      const leftComparable =
        sortKey === "tradeDate"
          ? new Date(left.tradeDate).getTime()
          : String(leftValue ?? "");
      const rightComparable =
        sortKey === "tradeDate"
          ? new Date(right.tradeDate).getTime()
          : String(rightValue ?? "");

      if (typeof leftComparable === "number" && typeof rightComparable === "number") {
        return sortDirection === "asc"
          ? leftComparable - rightComparable
          : rightComparable - leftComparable;
      }

      return sortDirection === "asc"
        ? String(leftComparable).localeCompare(String(rightComparable))
        : String(rightComparable).localeCompare(String(leftComparable));
    });
  }, [sort.direction, sort.key, trades]);

  const toggleSort = (key: SortKey) => {
    setSort((current) => {
      if (current.key !== key) {
        return { key, direction: "asc" };
      }

      if (current.direction === "asc") {
        return { key, direction: "desc" };
      }

      return { key: null, direction: null };
    });
  };

  const getIndicator = (key: SortKey) => {
    if (sort.key === key && sort.direction === "asc") {
      return "↑";
    }

    if (sort.key === key && sort.direction === "desc") {
      return "↓";
    }

    return "↕";
  };

  return (
    <div className="w-full overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
      <Table className="min-w-[640px] w-full">
        <TableHeader>
          <TableRow>
            {sortableColumns.map((column) => (
              <TableHead key={column.key}>
                <button
                  type="button"
                  onClick={() => toggleSort(column.key)}
                  className="group inline-flex items-center gap-1 text-left text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:text-foreground"
                >
                  <span>{column.label}</span>
                  <span
                    className={cn(
                      "text-sm transition-opacity",
                      sort.key === column.key ? "opacity-100" : "opacity-0 group-hover:opacity-40",
                    )}
                  >
                    {getIndicator(column.key)}
                  </span>
                </button>
              </TableHead>
            ))}
          </TableRow>
          </TableHeader>
          <TableBody>
          {sortedTrades.map((trade) => (
            <TableRow
              key={trade.id}
              onClick={() => onRowClick(trade)}
              className="cursor-pointer transition-colors hover:bg-accent/40"
            >
              <TableCell>{format(new Date(trade.tradeDate), "MMM d, yyyy")}</TableCell>
              <TableCell>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{trade.coin}</p>
                    {trade.chartImageUrl ? (
                      <span className="inline-flex items-center rounded-full border border-border bg-muted px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                        <ImageIcon className="mr-1 h-3 w-3" />
                        Chart
                      </span>
                    ) : null}
                  </div>
                  {trade.tags.length ? (
                    <div className="flex flex-wrap gap-1">
                      {trade.tags.slice(0, 2).map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full bg-muted px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] text-muted-foreground"
                        >
                          {tag}
                        </span>
                      ))}
                      {trade.tags.length > 2 ? (
                        <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                          +{trade.tags.length - 2}
                        </span>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </TableCell>
              <TableCell>
                <Badge variant={trade.direction === "LONG" ? "success" : "danger"}>
                  <span className="status-dot bg-current" />
                  {trade.direction}
                </Badge>
              </TableCell>
              <TableCell>{trade.entryPrice}</TableCell>
              <TableCell>{trade.rrRatio.toFixed(2)}R</TableCell>
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
              <TableCell
                className={
                  trade.pnlPercent >= 0
                    ? "text-[color:var(--color-green)]"
                    : "text-[color:var(--color-red)]"
                }
              >
                {formatPercent(trade.pnlPercent)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
