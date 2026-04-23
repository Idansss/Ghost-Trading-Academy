"use client";

import type { Trade } from "@prisma/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { fetchJson } from "@/lib/client-api";
import type { z } from "zod";
import type { tradeSchema } from "@/lib/validators";

export interface TradesResponse {
  trades: Trade[];
  summary: {
    totalPnl: number;
    winRate: number;
    avgRR: number;
    totalTrades: number;
    bestTrade: number;
    worstTrade: number;
    dailyLoss: number;
    snapshot: Record<string, number>;
    journalStreak: number;
    longestStreak: number;
    disciplineScore: number;
    loggedToday: boolean;
  };
}

/**
 * Loads journal trades with the active filter set.
 */
export function useTrades(searchParams: URLSearchParams | string) {
  const queryClient = useQueryClient();
  const queryKey = ["trades", searchParams.toString()];

  const tradesQuery = useQuery({
    queryKey,
    queryFn: () => fetchJson<TradesResponse>(`/api/trades?${searchParams.toString()}`),
  });

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: ["trades"] });
    await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
  };

  const createTrade = useMutation({
    mutationFn: (payload: z.input<typeof tradeSchema>) =>
      fetchJson<Trade>("/api/trades", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<TradesResponse>(queryKey);
      if (previous) {
        const optimisticTrade = {
          id: `optimistic-${Date.now()}`,
          userId: "",
          coin: payload.coin,
          direction: payload.direction,
          entryPrice: payload.entryPrice,
          stopLoss: payload.stopLoss,
          takeProfit: payload.takeProfit,
          tp2: payload.tp2 ?? null,
          tp3: payload.tp3 ?? null,
          rrRatio: 0,
          riskPercent: 0,
          pnlPercent: payload.pnlPercent,
          outcome: payload.outcome,
          setupType: payload.setupType,
          tags: payload.tags ?? [],
          notes: payload.notes ?? null,
          chartImageUrl: payload.chartImageUrl || null,
          tradeDate: new Date(payload.tradeDate),
          closedAt: null,
          month: "",
          emotionBefore: payload.emotionBefore ?? null,
          emotionDuring: payload.emotionDuring ?? null,
          emotionAfter: payload.emotionAfter ?? null,
          followedPlan: payload.followedPlan ?? null,
          revenge: payload.revenge ?? false,
          overSized: payload.overSized ?? false,
          movedStop: payload.movedStop ?? false,
          exitedEarly: payload.exitedEarly ?? false,
          mistakeNote: payload.mistakeNote ?? null,
          lessonLearned: payload.lessonLearned ?? null,
          tradeRating: payload.tradeRating ?? null,
          createdAt: new Date(),
          updatedAt: new Date(),
        } as unknown as Trade;

        queryClient.setQueryData<TradesResponse>(queryKey, {
          ...previous,
          trades: [optimisticTrade, ...previous.trades],
          summary: {
            ...previous.summary,
            totalTrades: previous.summary.totalTrades + 1,
          },
        });
      }
      return { previous };
    },
    onSuccess: async () => {
      toast.success("Trade saved.");
      await invalidate();
    },
    onError: (error: Error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
      toast.error(error.message);
    },
  });

  const updateTrade = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: z.input<typeof tradeSchema> }) =>
      fetchJson<Trade>(`/api/trades/${id}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      }),
    onSuccess: async () => {
      toast.success("Trade updated.");
      await invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const deleteTrade = useMutation({
    mutationFn: (id: string) =>
      fetchJson<{ ok: true }>(`/api/trades/${id}`, { method: "DELETE" }),
    onSuccess: async () => {
      toast.success("Trade deleted.");
      await invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return {
    ...tradesQuery,
    createTrade,
    updateTrade,
    deleteTrade,
  };
}
