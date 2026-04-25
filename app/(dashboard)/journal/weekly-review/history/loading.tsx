// CLAUDE FIX: Missing loading.tsx for /journal/weekly-review/history.
import { Skeleton } from "@/components/ui/skeleton";

export default function WeeklyReviewHistoryLoading() {
  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-7 w-48" />
      </div>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="rounded-3xl border border-border p-5 space-y-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, j) => (
              <div key={j} className="space-y-1">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-5 w-12" />
              </div>
            ))}
          </div>
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
        </div>
      ))}
    </div>
  );
}
