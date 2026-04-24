import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

const LOGO_SRC = "/brand/logo.png";

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link
      href="/dashboard"
      className={cn(
        "flex items-center gap-3 rounded-2xl border border-border px-3 py-2 transition-colors hover:border-primary/40 hover:bg-accent/60",
        compact && "justify-center px-2",
      )}
    >
      <span className="relative grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-2xl bg-black ring-1 ring-border/60">
        <Image
          src={LOGO_SRC}
          alt=""
          width={40}
          height={40}
          className="h-full w-full object-contain p-0.5"
          priority
        />
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
