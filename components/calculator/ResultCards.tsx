import { MetricCard } from "@/components/shared/MetricCard";
import { formatCurrency } from "@/lib/utils";

export function ResultCards({
  maxRiskAmount,
  positionSize,
  rrRatio,
  potentialProfit,
}: {
  maxRiskAmount: number;
  positionSize: number;
  rrRatio: number;
  potentialProfit: number;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <MetricCard label="Max Risk Amount" value={formatCurrency(maxRiskAmount)} tone="negative" />
      <MetricCard label="Position Size" value={positionSize.toFixed(4)} />
      <MetricCard
        label="R:R Ratio"
        value={`${rrRatio.toFixed(2)}R`}
        tone={rrRatio >= 2 ? "positive" : rrRatio >= 1 ? "neutral" : "negative"}
      />
      <MetricCard label="Potential Profit" value={formatCurrency(potentialProfit)} tone="positive" />
    </div>
  );
}
