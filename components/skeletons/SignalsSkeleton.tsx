import { Skeleton } from "@/components/ui/skeleton";

export function SignalsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 5 }).map((_, index) => (
          <Skeleton key={index} className="h-10 w-28 rounded-full" />
        ))}
      </div>

      <div className="grid gap-6">
        {Array.from({ length: 2 }).map((_, index) => (
          <div key={index} className="rounded-3xl border border-border p-6">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-5 w-28" />
                  <div className="flex gap-2">
                    <Skeleton className="h-6 w-16 rounded-full" />
                    <Skeleton className="h-6 w-16 rounded-full" />
                    <Skeleton className="h-6 w-16 rounded-full" />
                  </div>
                </div>
              </div>
              <Skeleton className="h-4 w-24" />
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
              {Array.from({ length: 6 }).map((_, item) => (
                <Skeleton key={item} className="h-20 w-full rounded-2xl" />
              ))}
            </div>

            <Skeleton className="mt-6 h-24 w-full rounded-2xl" />

            <div className="mt-4 flex gap-2">
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
