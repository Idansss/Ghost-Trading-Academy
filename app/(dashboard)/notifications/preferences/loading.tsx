// CLAUDE FIX: Missing loading.tsx for /notifications/preferences.
import { Skeleton } from "@/components/ui/skeleton";

export default function NotificationPreferencesLoading() {
  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-7 w-52" />
        <Skeleton className="h-4 w-72" />
      </div>
      <div className="rounded-3xl border border-border overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <div className="grid grid-cols-4 gap-4">
            {["Notification type", "In-app", "Email", "Push"].map((col) => (
              <Skeleton key={col} className="h-3 w-16" />
            ))}
          </div>
        </div>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="grid grid-cols-4 gap-4 items-center px-5 py-4 border-b border-border last:border-0">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-5 w-9 rounded-full" />
            <Skeleton className="h-5 w-9 rounded-full" />
            <Skeleton className="h-5 w-9 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
