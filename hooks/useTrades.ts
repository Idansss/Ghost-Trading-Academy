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
    onSuccess: async () => {
      toast.success("Trade saved.");
      await invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
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
