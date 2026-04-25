// CLAUDE FIX: Missing loading.tsx for /signals/[id] detail page.
import { Skeleton } from "@/components/ui/skeleton";

export default function SignalDetailLoading() {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Skeleton className="h-8 w-8 rounded-xl" />
        <div className="space-y-1">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-6 w-40" />
        </div>
      </div>
      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <div className="space-y-5">
          <div className="rounded-3xl border border-border p-6 space-y-4">
            <div className="flex items-center justify-between">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="rounded-2xl border border-border p-3 space-y-1">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-5 w-20" />
                </div>
              ))}
            </div>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>
          <Skeleton className="h-72 w-full rounded-3xl" />
        </div>
        <div className="space-y-4">
          <div className="rounded-3xl border border-border p-5 space-y-3">
            <Skeleton className="h-5 w-28" />
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
          <Skeleton className="h-11 w-full rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
