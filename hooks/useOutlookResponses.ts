"use client";

import type { MarketBias, OutlookMemberResponse } from "@prisma/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { fetchJson } from "@/lib/client-api";
import type { z } from "zod";
import type { outlookMemberResponseSchema } from "@/lib/validators";

type ResponseWithMember = OutlookMemberResponse & {
  member: { id: string; name: string | null; avatarUrl: string | null };
};

export function useOutlookResponses(outlookId: string | undefined) {
  return useQuery({
    queryKey: ["outlook-responses", outlookId],
    queryFn: () =>
      fetchJson<{ responses: ResponseWithMember[] }>(
        `/api/outlook/${outlookId}/responses`,
      ),
    enabled: !!outlookId,
  });
}

export function useOutlookResponseMutations(outlookId: string) {
  const queryClient = useQueryClient();

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["outlook-responses", outlookId] });

  const submit = useMutation({
    mutationFn: (payload: z.infer<typeof outlookMemberResponseSchema>) =>
      fetchJson<ResponseWithMember>(`/api/outlook/${outlookId}/responses`, {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: async () => {
      await invalidate();
      toast.success("Your view has been posted.");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const remove = useMutation({
    mutationFn: () =>
      fetch(`/api/outlook/${outlookId}/responses`, {
        method: "DELETE",
        credentials: "include",
      }),
    onSuccess: async () => {
      await invalidate();
      toast.success("Response removed.");
    },
    onError: () => toast.error("Failed to remove response."),
  });

  return { submit, remove };
}

export type { ResponseWithMember, MarketBias };
