"use client";

import { useDeferredValue, useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import type { GlobalSearchItem } from "@/components/layout/GlobalSearch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

export function MobileSearch({ items }: { items: GlobalSearchItem[] }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);

  const filteredItems = useMemo(() => {
    const normalized = deferredQuery.trim().toLowerCase();
    if (!normalized) return items.slice(0, 8);
    return items.filter((item) =>
      [item.title, item.subtitle, item.section].some((v) =>
        v.toLowerCase().includes(normalized),
      ),
    );
  }, [deferredQuery, items]);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setQuery("");
      }}
    >
      <DialogTrigger asChild>
        <Button type="button" variant="ghost" size="icon" className="h-10 w-10" aria-label="Open search">
          <Search className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg p-0">
        <DialogHeader className="border-b border-border px-5 pb-4 pt-5">
          <DialogTitle className="text-sm font-semibold">Search the desk</DialogTitle>
          <Input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search pages, signals, trades, resources..."
            className="mt-3"
          />
        </DialogHeader>
        <div className="max-h-[56vh] overflow-y-auto p-2">
          {filteredItems.length ? (
            <div className="space-y-1">
              {filteredItems.map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="flex items-start justify-between gap-4 rounded-2xl border border-transparent px-4 py-3 transition hover:border-primary/20 hover:bg-accent/60"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">{item.title}</p>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">{item.subtitle}</p>
                  </div>
                  <Badge variant="muted" className="shrink-0 text-[10px]">
                    {item.section}
                  </Badge>
                </Link>
              ))}
            </div>
          ) : (
            <div className="py-10 text-center text-sm text-muted-foreground">
              No results match that search.
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
