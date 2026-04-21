import { Skeleton } from "@/components/ui/skeleton";

export function JournalSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} className="h-9 w-24 rounded-full" />
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-28 w-full rounded-3xl" />
        ))}
      </div>

      <div className="rounded-3xl border border-border p-6">
        <div className="grid grid-cols-10 gap-3">
          {Array.from({ length: 10 }).map((_, index) => (
            <Skeleton key={index} className="h-4 w-full" />
          ))}
        </div>
        <div className="mt-5 space-y-3">
          {Array.from({ length: 8 }).map((_, row) => (
            <div key={row} className="grid grid-cols-10 gap-3">
              {Array.from({ length: 10 }).map((_, column) => (
                <Skeleton key={column} className="h-10 w-full" />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
