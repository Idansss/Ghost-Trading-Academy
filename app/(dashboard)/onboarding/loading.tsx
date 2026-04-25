// CLAUDE FIX: Missing loading.tsx for /onboarding.
import { Skeleton } from "@/components/ui/skeleton";

export default function OnboardingLoading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="w-full max-w-xl space-y-6 rounded-3xl border border-border p-8">
        <div className="space-y-2">
          <Skeleton className="mx-auto h-12 w-12 rounded-2xl" />
          <Skeleton className="mx-auto h-6 w-48" />
          <Skeleton className="mx-auto h-4 w-64" />
        </div>
        <Skeleton className="h-2 w-full rounded-full" />
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 rounded-2xl border border-border p-4">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-48" />
              </div>
              <Skeleton className="h-5 w-5 rounded" />
            </div>
          ))}
        </div>
        <Skeleton className="h-11 w-full rounded-xl" />
      </div>
    </div>
  );
}
