// CLAUDE FIX: Missing loading.tsx for the /community/chat/[channelId] dynamic route.
// Skeleton matches the single-channel view layout.
import { Skeleton } from "@/components/ui/skeleton";

export default function ChannelLoading() {
  return (
    <div className="flex h-[calc(100dvh-14rem)] flex-col gap-4 overflow-hidden rounded-3xl border border-border">
      <div className="border-b border-border px-5 py-4 flex items-center gap-3">
        <Skeleton className="h-8 w-8 rounded-full" />
        <div className="space-y-1">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
      <div className="flex flex-col gap-4 flex-1 overflow-hidden px-5 py-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className={`flex gap-3 ${i % 4 === 0 ? "flex-row-reverse" : ""}`}>
            <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
            <div className="space-y-1">
              <Skeleton className={`h-3 ${i % 4 === 0 ? "w-16" : "w-24"}`} />
              <Skeleton className={`h-10 rounded-2xl ${i % 4 === 0 ? "w-44" : "w-60"}`} />
            </div>
          </div>
        ))}
      </div>
      <div className="border-t border-border px-5 py-4">
        <Skeleton className="h-12 w-full rounded-2xl" />
      </div>
    </div>
  );
}
