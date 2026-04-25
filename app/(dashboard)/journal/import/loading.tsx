// CLAUDE FIX: Missing loading.tsx for /journal/import.
import { Skeleton } from "@/components/ui/skeleton";

export default function JournalImportLoading() {
  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-7 w-44" />
        <Skeleton className="h-4 w-72" />
      </div>
      <div className="rounded-3xl border border-border p-6 space-y-5">
        <Skeleton className="h-5 w-32" />
        <div className="rounded-2xl border-2 border-dashed border-border p-10 flex flex-col items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-xl" />
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-3 w-32" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-10 w-full rounded-xl" />
        </div>
        <Skeleton className="h-11 w-32 rounded-xl" />
      </div>
    </div>
  );
}
