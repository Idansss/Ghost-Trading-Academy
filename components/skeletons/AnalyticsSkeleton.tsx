import { Skeleton } from "@/components/ui/skeleton";

export function AnalyticsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-border p-6">
        <div className="grid grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-4 w-full" />
          ))}
        </div>
        <div className="mt-5 space-y-3">
          {Array.from({ length: 6 }).map((_, row) => (
            <div key={row} className="grid grid-cols-6 gap-4">
              {Array.from({ length: 6 }).map((_, column) => (
                <Skeleton key={column} className="h-10 w-full" />
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Skeleton className="h-[320px] w-full rounded-3xl" />
        <Skeleton className="h-[320px] w-full rounded-3xl" />
      </div>
    </div>
  );
}
