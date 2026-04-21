"use client";

import { useMemo, useState } from "react";
import {
  calculatePositionSize,
  calculateRR,
} from "@/lib/calculations";

export interface CalculatorInput {
  balance: number;
  riskPercent: number;
  entry: number;
  stopLoss: number;
  takeProfit: number;
}

/**
 * Computes live position size calculator values.
 */
export function useCalculator(initialState?: Partial<CalculatorInput>) {
  const [state, setState] = useState<CalculatorInput>({
    balance: initialState?.balance ?? 10000,
    riskPercent: initialState?.riskPercent ?? 1,
    entry: initialState?.entry ?? 0,
    stopLoss: initialState?.stopLoss ?? 0,
    takeProfit: initialState?.takeProfit ?? 0,
  });

  const results = useMemo(() => {
    const maxRiskAmount = state.balance * (state.riskPercent / 100);
    const rrRatio = calculateRR(state.entry, state.stopLoss, state.takeProfit);
    const positionSize = calculatePositionSize(
      state.balance,
      state.riskPercent,
      state.entry,
      state.stopLoss,
    );
    const potentialProfit = maxRiskAmount * rrRatio;

    return {
      maxRiskAmount,
      rrRatio,
      positionSize,
      potentialProfit,
    };
  }, [state]);

  return {
    state,
    setState,
    results,
  };
}
