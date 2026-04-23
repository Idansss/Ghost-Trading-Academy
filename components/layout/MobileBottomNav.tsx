"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { isPathActive } from "@/components/layout/navigation";
import { primaryNav } from "@/components/layout/navigation";

const mobileItems = primaryNav.filter((item) =>
  // AUDIT FIX: Mobile navigation now exposes chat directly instead of the
  // broader community landing page so the chat experience is reachable in one tap.
  ["/dashboard", "/journal", "/signals", "/community/chat", "/education"].includes(item.href),
);

export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 flex h-16 border-t border-[color:var(--bg-border)] bg-[color:var(--bg-surface)] md:hidden">
      {mobileItems.map((item) => {
        const Icon = item.icon;
        const active = isPathActive(pathname, item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "relative flex w-1/5 flex-col items-center justify-center gap-1 text-[11px] transition-colors",
              active ? "text-[color:var(--color-gold)]" : "text-muted-foreground",
            )}
          >
            {active ? (
              <span className="absolute inset-x-0 top-0 h-0.5 bg-[color:var(--color-gold)]" />
            ) : null}
            <Icon className="h-4 w-4" />
            <span>
              {item.label === "My Journal" ? "Journal" : item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
