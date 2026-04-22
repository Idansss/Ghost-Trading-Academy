"use client";

import { ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/shared/PageHeader";
import { PageTransition } from "@/components/layout/PageTransition";
import { CalculatorForm } from "@/components/calculator/CalculatorForm";
import { ResultCards } from "@/components/calculator/ResultCards";
import { VerdictCard } from "@/components/calculator/VerdictCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCalculator } from "@/hooks/useCalculator";

export default function CalculatorPage() {
  const { state, setState, results } = useCalculator();
  const router = useRouter();

  const isValid = state.entry > 0 && state.stopLoss > 0 && state.takeProfit > 0;

  const handleLogTrade = () => {
    const params = new URLSearchParams({
      entry: String(state.entry),
      stopLoss: String(state.stopLoss),
      takeProfit: String(state.takeProfit),
      rr: results.rrRatio.toFixed(2),
    });
    router.push(`/journal?${params.toString()}`);
  };

  return (
    <PageTransition>
      <div className="space-y-6">
        <PageHeader
          eyebrow="Calculator"
          title="Position Size Calculator"
          description="Validate risk before you commit capital."
        />

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Inputs</CardTitle>
            </CardHeader>
            <CardContent>
              <CalculatorForm value={state} onChange={setState} />
            </CardContent>
          </Card>
          <div className="space-y-6">
            <ResultCards {...results} />
            <VerdictCard rrRatio={results.rrRatio} />
            {isValid && (
              <Button
                type="button"
                variant="outline"
                className="w-full gap-2"
                onClick={handleLogTrade}
              >
                Log this trade in journal
                <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
