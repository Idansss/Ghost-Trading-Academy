"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchJson } from "@/lib/client-api";

type WatchlistItem = { id: string; symbol: string };

export function WatchlistWidget() {
  const watchlistQuery = useQuery({
    queryKey: ["watchlist-widget"],
    queryFn: () => fetchJson<{ items: WatchlistItem[] }>("/api/watchlist"),
  });
  const items = (watchlistQuery.data?.items ?? []).slice(0, 5);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Watchlist</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {items.length ? (
          items.map((item) => (
            <div key={item.id} className="text-sm">
              {item.symbol}
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">No watchlist items yet.</p>
        )}
      </CardContent>
    </Card>
  );
}
