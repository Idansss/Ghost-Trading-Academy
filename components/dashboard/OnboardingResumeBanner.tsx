"use client";

import Link from "next/link";
import { X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

type OnboardingResumeBannerProps = {
  completed: boolean;
  completedCount: number;
  totalSteps: number;
  progressPercent: number;
  nextStepTitle?: string | null;
};

export function OnboardingResumeBanner({
  completed,
  completedCount,
  totalSteps,
  progressPercent,
  nextStepTitle,
}: OnboardingResumeBannerProps) {
  const storageKey = useMemo(
    () => `ghost-onboarding-banner-dismissed-${completedCount}`,
    [completedCount],
  );
  const [dismissed, setDismissed] = useState<boolean>(() => {
    if (typeof window === "undefined") {
      return false;
    }

    return window.sessionStorage.getItem(storageKey) === "1";
  });

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    setDismissed(window.sessionStorage.getItem(storageKey) === "1");
  }, [storageKey]);

  if (completed || dismissed) {
    return null;
  }

  return (
    <div className="rounded-3xl border border-primary/20 bg-primary/10 p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <p className="text-sm font-semibold text-primary">Resume onboarding</p>
            <span className="rounded-full bg-background/80 px-3 py-1 text-xs text-muted-foreground">
              {completedCount}/{totalSteps} complete
            </span>
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-semibold text-foreground">
              Finish setting up the desk
            </h2>
            <p className="text-sm text-muted-foreground">
              {nextStepTitle
                ? `Next step: ${nextStepTitle}.`
                : "You still have setup steps left before the desk is fully configured."}
            </p>
          </div>
          <Progress className="max-w-xl" value={progressPercent} />
        </div>

        <div className="flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/onboarding">Resume onboarding</Link>
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              window.sessionStorage.setItem(storageKey, "1");
              setDismissed(true);
            }}
          >
            <X className="mr-2 h-4 w-4" />
            Dismiss
          </Button>
        </div>
      </div>
    </div>
  );
}
