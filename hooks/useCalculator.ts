"use client";

import { useMemo, useState } from "react";
import {
  calculatePositionSize,
  calculateRR,
} from "@/lib/calculations";

export interface CalculatorInput {
  balance: number | "";
  riskPercent: number | "";
  entry: number | "";
  stopLoss: number | "";
  takeProfit: number | "";
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
    const balance = Number(state.balance) || 0;
    const riskPercent = Number(state.riskPercent) || 0;
    const entry = Number(state.entry) || 0;
    const stopLoss = Number(state.stopLoss) || 0;
    const takeProfit = Number(state.takeProfit) || 0;

    const maxRiskAmount = balance * (riskPercent / 100);
    const rrRatio = calculateRR(entry, stopLoss, takeProfit);
    const positionSize = calculatePositionSize(
      balance,
      riskPercent,
      entry,
      stopLoss,
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
