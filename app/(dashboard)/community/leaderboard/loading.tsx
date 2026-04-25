// CLAUDE FIX: Missing loading.tsx for /community/leaderboard. Skeleton matches
// the actual layout: podium cards for top 3, table rows for the rest.
import { Skeleton } from "@/components/ui/skeleton";

export default function LeaderboardLoading() {
  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-4 w-64" />
      </div>

      {/* Podium top-3 skeleton */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[2, 1, 3].map((rank) => (
          <div
            key={rank}
            className={`rounded-3xl border border-border p-5 text-center space-y-3 ${rank === 1 ? "sm:order-first" : ""}`}
          >
            <Skeleton className="mx-auto h-5 w-5 rounded" />
            <Skeleton className="mx-auto h-12 w-12 rounded-full" />
            <div className="space-y-1">
              <Skeleton className="mx-auto h-4 w-24" />
              <Skeleton className="mx-auto h-3 w-16" />
            </div>
            <Skeleton className="mx-auto h-6 w-20" />
          </div>
        ))}
      </div>

      {/* Table skeleton for positions 4–10 */}
      <div className="rounded-3xl border border-border overflow-hidden">
        <div className="border-b border-border px-5 py-3">
          <Skeleton className="h-4 w-24" />
        </div>
        {Array.from({ length: 7 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 px-5 py-3 border-b border-border last:border-0"
          >
            <Skeleton className="h-4 w-6" />
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="flex-1 space-y-1">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-20" />
            </div>
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-12" />
          </div>
        ))}
      </div>
    </div>
  );
}
