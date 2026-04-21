import { formatPercent } from "@/lib/utils";

export function MonthlySnapshotGrid({
  snapshot,
}: {
  snapshot: Record<string, number>;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {Object.entries(snapshot).map(([month, pnl]) => (
        <div
          key={month}
          className={`rounded-2xl border p-4 ${
            pnl > 0
              ? "border-[color:var(--color-green)]/20 bg-[color:var(--color-green-light)]"
              : pnl < 0
                ? "border-[color:var(--color-red)]/20 bg-[color:var(--color-red-light)]"
                : "border-border bg-muted/40"
          }`}
        >
          <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
            {month}
          </p>
          <p className="mt-2 text-xl font-semibold">{formatPercent(pnl)}</p>
        </div>
      ))}
    </div>
  );
}
