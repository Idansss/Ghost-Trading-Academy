// CLAUDE FIX: Missing loading.tsx — the chat page had no loading state so
// users saw a blank page while server data was fetched. Added a skeleton that
// matches the actual ChatLayout split-pane structure.
import { Skeleton } from "@/components/ui/skeleton";

export default function ChatLoading() {
  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>
      <div className="flex h-[calc(100dvh-14rem)] gap-4 overflow-hidden rounded-3xl border border-border">
        {/* Channel sidebar skeleton */}
        <div className="w-64 shrink-0 space-y-2 border-r border-border p-4">
          <Skeleton className="h-8 w-full rounded-xl" />
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 rounded-xl p-2">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-3 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
        {/* Message area skeleton */}
        <div className="flex flex-1 flex-col gap-4 p-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className={`flex gap-3 ${i % 3 === 0 ? "flex-row-reverse" : ""}`}>
              <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
              <div className="space-y-1">
                <Skeleton className={`h-3 ${i % 3 === 0 ? "w-20" : "w-24"}`} />
                <Skeleton className={`h-10 rounded-2xl ${i % 3 === 0 ? "w-48" : "w-64"}`} />
              </div>
            </div>
          ))}
          <div className="mt-auto">
            <Skeleton className="h-12 w-full rounded-2xl" />
          </div>
        </div>
      </div>
    </div>
  );
}
