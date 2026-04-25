// CLAUDE FIX: Missing loading.tsx for /profile. Skeleton matches the
// two-column profile layout with the form on the left and stats on the right.
import { Skeleton } from "@/components/ui/skeleton";

export default function ProfileLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-7 w-44" />
        <Skeleton className="h-4 w-80" />
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.1fr_1fr]">
        <div className="rounded-3xl border border-border p-6 space-y-5">
          <Skeleton className="h-5 w-32" />
          <div className="flex items-center gap-4">
            <Skeleton className="h-16 w-16 rounded-full" />
          </div>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-10 w-full rounded-xl" />
            </div>
          ))}
          <Skeleton className="h-10 w-28 rounded-xl" />
        </div>
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-3xl border border-border p-5 space-y-2">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-7 w-16" />
              </div>
            ))}
          </div>
          <div className="rounded-3xl border border-border p-6 space-y-3">
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </div>
      </div>
    </div>
  );
}
