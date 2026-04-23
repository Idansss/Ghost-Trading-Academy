"use client";

import { Calculator } from "lucide-react";
import { RiskCalculator } from "@/components/calculator/RiskCalculator";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { parseChartPrice, parseEntryZonePrice } from "@/lib/chart-utils";

export function SignalPositionSizingSheet({
  entryZone,
  stopLoss,
  tp1,
  tp2,
  tp3,
}: {
  entryZone: string;
  stopLoss: string;
  tp1: string;
  tp2: string;
  tp3: string;
}) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button>
          <Calculator className="mr-2 h-4 w-4" />
          Size My Position
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full max-w-3xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Size This Signal</SheetTitle>
          <SheetDescription>
            Your saved account size and risk setting are applied automatically.
          </SheetDescription>
        </SheetHeader>
        <div className="mt-6">
          <RiskCalculator
            entry={parseEntryZonePrice(entryZone) ?? undefined}
            stopLoss={parseChartPrice(stopLoss) ?? undefined}
            tp1={parseChartPrice(tp1) ?? undefined}
            tp2={parseChartPrice(tp2) ?? undefined}
            tp3={parseChartPrice(tp3) ?? undefined}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
