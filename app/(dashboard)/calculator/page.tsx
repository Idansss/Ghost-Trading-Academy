import { RiskCalculator } from "@/components/calculator/RiskCalculator";
import { PageHeader } from "@/components/shared/PageHeader";
import { PageTransition } from "@/components/layout/PageTransition";

export default function CalculatorPage() {
  return (
    <PageTransition>
      <div className="space-y-6">
        <PageHeader
          eyebrow="Calculator"
          title="Position Size Calculator"
          description="Validate risk before you commit capital."
        />
        <RiskCalculator showLogTradeAction />
      </div>
    </PageTransition>
  );
}
