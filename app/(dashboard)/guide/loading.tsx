// CLAUDE FIX: Missing loading.tsx for /guide.
import { Skeleton } from "@/components/ui/skeleton";

export default function GuideLoading() {
  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-4 w-64" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-3xl border border-border p-6 space-y-3">
            <Skeleton className="h-8 w-8 rounded-xl" />
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-4/5" />
          </div>
        ))}
      </div>
    </div>
  );
}
