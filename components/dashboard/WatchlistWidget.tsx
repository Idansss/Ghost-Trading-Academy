"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CoinLogo } from "@/components/ui/CoinLogo";
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
            // CLAUDE FIX: coin_logo_component
            <div key={item.id} className="flex items-center gap-2 text-sm">
              <CoinLogo symbol={item.symbol} size={20} />
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
