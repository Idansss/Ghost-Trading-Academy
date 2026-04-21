"use client";

import type { Signal } from "@prisma/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { fetchJson } from "@/lib/client-api";
import type { z } from "zod";
import type { signalSchema } from "@/lib/validators";

/**
 * Loads signals by status filter.
 */
export function useSignals(status: string, enabled = true) {
  return useQuery({
    queryKey: ["signals", status],
    queryFn: () =>
      fetchJson<{ signals: Signal[] }>(
        `/api/signals${status && status !== "ALL" ? `?status=${status}` : ""}`,
      ),
    enabled,
  });
}

/**
 * Creates and updates admin signals.
 */
export function useSignalMutations() {
  const queryClient = useQueryClient();

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: ["signals"] });
    await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
  };

  const createSignal = useMutation({
    mutationFn: (payload: z.input<typeof signalSchema>) =>
      fetchJson<Signal>("/api/signals", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: async () => {
      toast.success("Signal posted.");
      await invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const updateSignal = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<z.input<typeof signalSchema>> }) =>
      fetchJson<Signal>(`/api/signals/${id}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      }),
    onSuccess: async () => {
      toast.success("Signal updated.");
      await invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const deleteSignal = useMutation({
    mutationFn: (id: string) =>
      fetchJson<{ ok: true }>(`/api/signals/${id}`, { method: "DELETE" }),
    onSuccess: async () => {
      toast.success("Signal deleted.");
      await invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return { createSignal, updateSignal, deleteSignal };
}
