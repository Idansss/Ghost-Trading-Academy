// CLAUDE FIX: Missing loading.tsx for /journal/weekly-review.
import { Skeleton } from "@/components/ui/skeleton";

export default function WeeklyReviewLoading() {
  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-72" />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-3xl border border-border p-5 space-y-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-7 w-16" />
          </div>
        ))}
      </div>
      <div className="rounded-3xl border border-border p-6 space-y-5">
        <Skeleton className="h-5 w-36" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-24 w-full rounded-xl" />
          </div>
        ))}
        <Skeleton className="h-11 w-full rounded-xl" />
      </div>
    </div>
  );
}
