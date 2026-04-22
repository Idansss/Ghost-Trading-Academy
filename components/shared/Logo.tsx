import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link
      href="/dashboard"
      className={cn(
        "flex items-center gap-3 rounded-2xl border border-border px-3 py-2 transition-colors hover:border-primary/40 hover:bg-accent/60",
        compact && "justify-center px-2",
      )}
    >
      <span className="grid h-10 w-10 place-items-center rounded-2xl bg-primary/15 text-sm font-semibold text-primary">
        AV
      </span>
      {!compact ? (
        <span className="flex flex-col">
          <span className="text-sm font-semibold">Ghost VIP</span>
          <span className="text-xs text-muted-foreground">
            Ghost Trading Desk
          </span>
        </span>
      ) : null}
    </Link>
  );
}
