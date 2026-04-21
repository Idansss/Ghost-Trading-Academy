"use client";

import { Zap } from "lucide-react";
import { motion } from "framer-motion";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { PageTransition } from "@/components/layout/PageTransition";
import { PageHeader } from "@/components/shared/PageHeader";
import { VipGate } from "@/components/shared/VipGate";
import { SignalsSkeleton } from "@/components/skeletons/SignalsSkeleton";
import { SignalCard } from "@/components/signals/SignalCard";
import { SignalFilters } from "@/components/signals/SignalFilters";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { useSignals } from "@/hooks/useSignals";

export default function SignalsPage() {
  const [filter, setFilter] = useState("ALL");
  const { data: session } = useSession();
  const gated = session?.user.role === "MEMBER";
  const { data, isLoading, isError, refetch } = useSignals(filter, !gated);

  return (
    <PageTransition>
    <div className="space-y-6">
      <PageHeader
        eyebrow="Signals"
        title="VIP Trade Signals"
        description="Admin-issued setups with entries, invalidation, and structured targets."
      />
      <SignalFilters value={filter} onValueChange={setFilter} />

      {gated ? (
        <VipGate enabled>
          <SignalsSkeleton />
        </VipGate>
      ) : isLoading ? (
        <SignalsSkeleton />
      ) : isError ? (
        <ErrorState
          title="Signals unavailable"
          description="There was a problem loading the latest signals."
          onRetry={() => {
            void refetch();
          }}
        />
      ) : data?.signals.length ? (
        <div className="grid gap-6">
          {data.signals.map((signal, index) => (
            <motion.div
              key={signal.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.07 }}
            >
              <SignalCard signal={signal} />
            </motion.div>
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
