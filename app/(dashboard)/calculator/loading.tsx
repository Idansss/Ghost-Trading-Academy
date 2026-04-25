// CLAUDE FIX: Missing loading.tsx for /calculator.
import { Skeleton } from "@/components/ui/skeleton";

export default function CalculatorLoading() {
  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-72" />
      </div>
      <div className="grid gap-5 lg:grid-cols-[1.2fr_1fr]">
        <div className="rounded-3xl border border-border p-6 space-y-5">
          <Skeleton className="h-5 w-36" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-10 w-full rounded-xl" />
            </div>
          ))}
          <Skeleton className="h-11 w-full rounded-xl" />
        </div>
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-3xl border border-border p-5 space-y-2">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-3 w-48" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
