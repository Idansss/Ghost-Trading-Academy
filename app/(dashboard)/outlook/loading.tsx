// CLAUDE FIX: Missing loading.tsx for /outlook.
import { Skeleton } from "@/components/ui/skeleton";

export default function OutlookLoading() {
  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-7 w-44" />
        <Skeleton className="h-4 w-72" />
      </div>
      {/* Bias card */}
      <div className="rounded-3xl border border-border p-6 space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-48 w-full rounded-2xl" />
      </div>
      {/* Coins to watch */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-3xl border border-border p-5 space-y-3">
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-32 w-full rounded-2xl" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
          </div>
        ))}
      </div>
    </div>
  );
}
