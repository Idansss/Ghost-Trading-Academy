import { Skeleton } from "@/components/ui/skeleton";

export function CommunitySkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[1.45fr_1fr]">
        <div className="space-y-6">
          <div className="rounded-3xl border border-border p-6">
            <Skeleton className="h-6 w-40" />
            <div className="mt-5 space-y-3">
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className="h-24 w-full rounded-2xl" />
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-border p-6">
            <Skeleton className="h-6 w-32" />
            <div className="mt-5 space-y-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <Skeleton key={index} className="h-20 w-full rounded-2xl" />
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <Skeleton className="h-[240px] w-full rounded-3xl" />
          <div className="rounded-3xl border border-border p-6">
            <Skeleton className="h-6 w-36" />
            <div className="mt-5 grid grid-cols-2 gap-3">
              {Array.from({ length: 8 }).map((_, index) => (
                <Skeleton key={index} className="h-20 w-full rounded-2xl" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
