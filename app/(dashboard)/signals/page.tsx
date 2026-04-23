import Link from "next/link";
import { Plus, Settings2, Zap } from "lucide-react";
import { SignalsWinRateBadge } from "@/components/signals/SignalsWinRateBadge";
import { SignalFilters } from "@/components/signals/SignalFilters";
import { SignalCard } from "@/components/signals/SignalCard";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
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
  const user = await requireUser();

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
        action={
          <div className="flex flex-wrap items-center gap-2">
            {user.role === "ADMIN" ? (
              <>
                <Button asChild variant="outline">
                  <Link href="/admin/signals">
                    <Settings2 className="mr-2 h-4 w-4" />
                    Manage Signals
                  </Link>
                </Button>
                <Button asChild>
                  <Link href="/admin/signals">
                    <Plus className="mr-2 h-4 w-4" />
                    Post Signal
                  </Link>
                </Button>
              </>
            ) : null}
            <SignalsWinRateBadge />
          </div>
        }
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
      {!signals.length && user.role === "ADMIN" ? (
        <div className="-mt-2 flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/admin/signals">
              <Plus className="mr-2 h-4 w-4" />
              Post your first signal
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/admin/signals">
              <Settings2 className="mr-2 h-4 w-4" />
              Open admin signal desk
            </Link>
          </Button>
        </div>
      ) : null}
    </div>
  );
}
