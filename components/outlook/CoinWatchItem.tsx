import { Badge } from "@/components/ui/badge";
import { CoinLogo } from "@/components/ui/CoinLogo";

// CLAUDE FIX: coin_logo_component — added logo beside coin name in outlook cards
export function CoinWatchItem({ coin, note }: { coin: string; note: string }) {
  return (
    <div className="rounded-2xl border border-border p-4">
      <div className="flex items-center gap-2">
        <CoinLogo symbol={coin} size={24} />
        <Badge>{coin}</Badge>
      </div>
      <p className="mt-3 text-sm text-muted-foreground">{note}</p>
    </div>
  );
}
