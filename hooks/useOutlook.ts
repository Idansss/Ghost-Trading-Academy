"use client";

import type { DailyOutlook } from "@prisma/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { fetchJson } from "@/lib/client-api";
import type { z } from "zod";
import type { outlookSchema } from "@/lib/validators";

/**
 * Loads the latest or selected daily outlook.
 */
export function useOutlook(date?: string, enabled = true) {
  return useQuery({
    queryKey: ["outlook", date ?? "latest"],
    queryFn: () =>
      fetchJson<{ outlook: DailyOutlook | null }>(
        `/api/outlook${date ? `?date=${date}` : ""}`,
      ),
    enabled,
  });
}

/**
 * Creates or updates the daily outlook from the admin panel.
 */
export function useOutlookMutations() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: z.infer<typeof outlookSchema>) =>
      fetchJson<DailyOutlook>("/api/outlook", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["outlook"] });
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });
}
