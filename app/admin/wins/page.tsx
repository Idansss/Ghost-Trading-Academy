"use client";

import type { MemberWin } from "@prisma/client";
import { CheckCircle2, Trash2 } from "lucide-react";
import { formatDistanceToNowStrict } from "date-fns";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { PageTransition } from "@/components/layout/PageTransition";
import { Breadcrumb } from "@/components/shared/Breadcrumb";
import { PageHeader } from "@/components/shared/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ErrorState } from "@/components/ui/ErrorState";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchJson } from "@/lib/client-api";
import { formatPercent } from "@/lib/utils";

type WinWithUser = MemberWin & { user: { name: string; avatarUrl: string | null } };

export default function AdminWinsPage() {
  const queryClient = useQueryClient();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["admin-wins"],
    queryFn: () => fetchJson<{ wins: WinWithUser[] }>("/api/member-wins?all=true"),
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) =>
      fetchJson(`/api/member-wins/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ isApproved: true }),
      }),
    onSuccess: (_, id) => {
      toast.success("Win approved.");
      queryClient.setQueryData<{ wins: WinWithUser[] }>(["admin-wins"], (prev) => ({
        wins: (prev?.wins ?? []).map((w) => (w.id === id ? { ...w, isApproved: true } : w)),
      }));
    },
    onError: () => toast.error("Failed to approve win."),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      fetchJson(`/api/member-wins/${id}`, { method: "DELETE" }),
    onSuccess: (_, id) => {
      toast.success("Win deleted.");
      queryClient.setQueryData<{ wins: WinWithUser[] }>(["admin-wins"], (prev) => ({
        wins: (prev?.wins ?? []).filter((w) => w.id !== id),
      }));
    },
    onError: () => toast.error("Failed to delete win."),
  });

  return (
    <PageTransition>
      <div className="space-y-6">
        <Breadcrumb items={[{ label: "Admin", href: "/admin" }, { label: "Win Moderation" }]} />
        <PageHeader
          eyebrow="Admin"
          title="Win Moderation"
          description="Review, approve, or remove member win submissions before they appear in the community feed."
        />

        <Card>
          <CardHeader>
            <CardTitle>All Wins</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full rounded-2xl" />
                ))}
              </div>
            ) : isError ? (
              <ErrorState
                title="Could not load wins"
                description="There was a problem loading member wins."
                onRetry={() => void refetch()}
              />
            ) : data?.wins.length ? (
              <div className="space-y-3">
                {data.wins.map((win) => (
                  <div
                    key={win.id}
                    className="flex flex-col gap-3 rounded-2xl border border-border p-4 sm:flex-row sm:items-start sm:justify-between"
                  >
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-medium">{win.user.name}</p>
                        <Badge variant="muted">{win.coin}</Badge>
                        <Badge variant={win.pnlPercent >= 0 ? "success" : "danger"}>
                          {formatPercent(win.pnlPercent)}
                        </Badge>
                        {win.isApproved ? (
                          <Badge variant="success">Approved</Badge>
                        ) : (
                          <Badge variant="warning">Pending</Badge>
                        )}
                      </div>
                      <p className="line-clamp-2 text-sm text-muted-foreground">{win.message}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNowStrict(new Date(win.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      {!win.isApproved && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="gap-1.5 text-[color:var(--color-green)]"
                          disabled={approveMutation.isPending}
                          onClick={() => approveMutation.mutate(win.id)}
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          Approve
                        </Button>
                      )}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground hover:text-destructive"
                        disabled={deleteMutation.isPending}
                        onClick={() => deleteMutation.mutate(win.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No member wins submitted yet.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </PageTransition>
  );
}
