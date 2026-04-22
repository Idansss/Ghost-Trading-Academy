"use client";

import { useDeferredValue, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export type GlobalSearchItem = {
  id: string;
  title: string;
  subtitle: string;
  href: string;
  section: string;
};

export function GlobalSearch({ items }: { items: GlobalSearchItem[] }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((value) => !value);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const filteredItems = useMemo(() => {
    const normalized = deferredQuery.trim().toLowerCase();
    if (!normalized) {
      return items.slice(0, 10);
    }

    return items.filter((item) =>
      [item.title, item.subtitle, item.section].some((value) =>
        value.toLowerCase().includes(normalized),
      ),
    );
  }, [deferredQuery, items]);

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) {
          setQuery("");
        }
      }}
    >
      <DialogTrigger asChild>
        <button
          type="button"
          aria-label="Open global search"
          className="flex w-full items-center gap-3 rounded-2xl border border-border bg-card px-4 py-2.5 text-left text-sm text-muted-foreground transition hover:border-primary/30 hover:bg-accent/50"
        >
          <Search className="h-4 w-4 shrink-0" />
          <span className="truncate">Search pages, trades, signals, resources...</span>
          <span className="ml-auto hidden rounded-lg border border-border px-2 py-1 text-[11px] uppercase tracking-[0.18em] sm:inline-flex">
            Ctrl K
          </span>
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl p-0">
        <DialogHeader className="border-b border-border px-6 pb-4 pt-6">
          <DialogTitle>Search the desk</DialogTitle>
          <DialogDescription>
            Jump to workspace pages and recent trading content.
          </DialogDescription>
          <Input
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search pages, signals, recent trades, resources..."
            className="mt-4"
          />
        </DialogHeader>

        <div className="max-h-[420px] overflow-y-auto p-3">
          {filteredItems.length ? (
            <div className="space-y-2">
              {filteredItems.map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-start justify-between gap-4 rounded-2xl border border-transparent px-4 py-3 transition hover:border-primary/20 hover:bg-accent/60",
                  )}
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">{item.title}</p>
                    <p className="mt-1 truncate text-sm text-muted-foreground">{item.subtitle}</p>
                  </div>
                  <Badge variant="muted" className="shrink-0">
                    {item.section}
                  </Badge>
                </Link>
              ))}
            </div>
          ) : (
            <div className="px-4 py-10 text-center text-sm text-muted-foreground">
              No results match that search.
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
