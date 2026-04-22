"use client";

import { motion } from "framer-motion";
import { MetricCard } from "@/components/shared/MetricCard";
import { formatPercent } from "@/lib/utils";

export function StatsGrid({
  totalPnl,
  winRate,
  avgRR,
  totalTrades,
}: {
  totalPnl: number;
  winRate: number;
  avgRR: number;
  totalTrades: number;
}) {
  const kpiCards = [
    {
      label: "Total P&L This Month",
      value: formatPercent(totalPnl),
      tone: totalPnl >= 0 ? ("positive" as const) : ("negative" as const),
    },
    { label: "Win Rate", value: `${winRate.toFixed(1)}%` },
    { label: "Average R:R", value: `${avgRR.toFixed(2)}R` },
    { label: "Trades Taken", value: `${totalTrades}` },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {kpiCards.map((card, index) => (
        <motion.div
          key={card.label}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.06, duration: 0.22 }}
        >
          <MetricCard {...card} />
        </motion.div>
      ))}
    </div>
  );
}
