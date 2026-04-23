import { Zap } from "lucide-react";
import { SignalsWinRateBadge } from "@/components/signals/SignalsWinRateBadge";
import { SignalFilters } from "@/components/signals/SignalFilters";
import { SignalCard } from "@/components/signals/SignalCard";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { signalFilterStatuses } from "@/lib/signal-performance";

type SignalStatus = (typeof signalFilterStatuses)[number];

export default async function SignalsPage({
  searchParams,
}: {
  searchParams?: { status?: string };
}) {
  await requireUser();

  const status = (searchParams?.status?.toUpperCase() ?? "ALL") as SignalStatus;
  const signals = await prisma.signal.findMany({
    where: status !== "ALL" ? { status } : undefined,
    orderBy: { postedAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Signals"
        title="Trade Signals"
        description="Admin-issued setups with entries, invalidation, and structured targets."
        action={<SignalsWinRateBadge />}
      />
      <SignalFilters value={status} />

      {signals.length ? (
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
  );
}
