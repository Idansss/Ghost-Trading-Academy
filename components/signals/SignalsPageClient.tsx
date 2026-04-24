"use client";

import { Plus, Settings2, Zap } from "lucide-react";
import { SignalsDesk } from "@/components/admin/SignalsDesk";
import { PageTransition } from "@/components/layout/PageTransition";
import { SignalCard } from "@/components/signals/SignalCard";
import { SignalFilters } from "@/components/signals/SignalFilters";
import { SignalsWinRateBadge } from "@/components/signals/SignalsWinRateBadge";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Skeleton } from "@/components/ui/skeleton";
import { useSignals } from "@/hooks/useSignals";

function scrollToSection(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export function SignalsPageClient({
  status,
  isAdmin,
}: {
  status: string;
  isAdmin: boolean;
}) {
  const { data, isLoading, isError, refetch } = useSignals(status);
  const signals = data?.signals ?? [];

  return (
    <PageTransition>
      <div className="space-y-6">
        <PageHeader
          eyebrow="Signals"
          title="Trade Signals"
          description="Admin-issued setups with entries, invalidation, and structured targets."
          action={
            <div className="flex flex-wrap items-center gap-2">
              {isAdmin ? (
                <>
                  <Button variant="outline" onClick={() => scrollToSection("signals-admin-desk")}>
                    <Settings2 className="mr-2 h-4 w-4" />
                    Manage Signals
                  </Button>
                  <Button onClick={() => scrollToSection("signals-admin-create")}>
                    <Plus className="mr-2 h-4 w-4" />
                    Post Signal
                  </Button>
                </>
              ) : null}
              <SignalsWinRateBadge />
            </div>
          }
        />
        <SignalFilters value={status} />

        {isAdmin ? <SignalsDesk /> : null}

        {isLoading ? (
          <div className="grid gap-6">
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className="h-[320px] w-full rounded-[28px]" />
            ))}
          </div>
        ) : isError ? (
          <ErrorState
            title="Signals unavailable"
            description="There was a problem loading the signals desk."
            onRetry={() => {
              void refetch();
            }}
          />
        ) : signals.length ? (
          <div className="grid gap-6">
            {signals.map((signal) => (
              <SignalCard key={signal.id} signal={signal} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<Zap />}
            title="No signals for this filter"
            description="Try selecting a different filter, or check back when new signals are posted."
          />
        )}
      </div>
    </PageTransition>
  );
}
