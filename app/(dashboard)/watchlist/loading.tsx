// CLAUDE FIX: Missing loading.tsx for /watchlist. Users saw a blank page
// while the server fetched watchlist items. Skeleton matches the card grid layout.
import { Skeleton } from "@/components/ui/skeleton";

export default function WatchlistLoading() {
  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-7 w-36" />
        <Skeleton className="h-4 w-64" />
      </div>
      <div className="flex gap-3">
        <Skeleton className="h-10 w-40 rounded-xl" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="rounded-3xl border border-border p-5 space-y-3">
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-4 w-4 rounded" />
            </div>
            <Skeleton className="h-8 w-28" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-3 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
