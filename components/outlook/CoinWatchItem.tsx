import { Badge } from "@/components/ui/badge";

export function CoinWatchItem({ coin, note }: { coin: string; note: string }) {
  return (
    <div className="rounded-2xl border border-border p-4">
      <Badge>{coin}</Badge>
      <p className="mt-3 text-sm text-muted-foreground">{note}</p>
    </div>
  );
}
