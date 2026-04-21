import { Skeleton } from "@/components/ui/skeleton";

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="rounded-3xl border border-border p-6">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="mt-4 h-8 w-28" />
            <Skeleton className="mt-4 h-10 w-10 rounded-2xl" />
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.65fr_1fr]">
        <Skeleton className="h-[420px] w-full rounded-3xl" />
        <Skeleton className="h-[420px] w-full rounded-3xl" />
      </div>

      <div className="rounded-3xl border border-border p-6">
        <Skeleton className="h-5 w-32" />
        <div className="mt-6 space-y-4">
          <div className="grid grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-4 w-full" />
            ))}
          </div>
          {Array.from({ length: 5 }).map((_, row) => (
            <div key={row} className="grid grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, column) => (
                <Skeleton key={column} className="h-10 w-full" />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
