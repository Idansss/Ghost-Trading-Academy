"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { PageTransition } from "@/components/layout/PageTransition";
import { CalculatorForm } from "@/components/calculator/CalculatorForm";
import { ResultCards } from "@/components/calculator/ResultCards";
import { VerdictCard } from "@/components/calculator/VerdictCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCalculator } from "@/hooks/useCalculator";

export default function CalculatorPage() {
  const { state, setState, results } = useCalculator();

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
        </div>
      </div>
    </div>
    </PageTransition>
  );
}
