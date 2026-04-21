"use client";

import type { WeeklyRecap } from "@prisma/client";
import { format } from "date-fns";
import { ChevronDown, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { WeeklyRecapForm } from "@/components/admin/WeeklyRecapForm";
import { PageTransition } from "@/components/layout/PageTransition";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { fetchJson } from "@/lib/client-api";
import { formatPercent } from "@/lib/utils";

export default function AdminRecapsPage() {
  const queryClient = useQueryClient();
  const [editingRecap, setEditingRecap] = useState<WeeklyRecap | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [expandedRecapId, setExpandedRecapId] = useState<string | null>(null);
  const [deleteRecap, setDeleteRecap] = useState<WeeklyRecap | null>(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["recaps"],
    queryFn: () => fetchJson<{ recaps: WeeklyRecap[] }>("/api/weekly-recaps"),
  });

  const invalidateRecaps = async () => {
    await queryClient.invalidateQueries({ queryKey: ["recaps"] });
  };

  const createMutation = useMutation({
    mutationFn: (payload: unknown) =>
      fetchJson("/api/weekly-recaps", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: async () => {
      toast.success("Weekly recap posted.");
      setCreateOpen(false);
      await invalidateRecaps();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: unknown }) =>
      fetchJson(`/api/weekly-recaps/${id}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      }),
    onSuccess: async () => {
      toast.success("Weekly recap updated.");
      setEditingRecap(null);
      await invalidateRecaps();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      fetchJson(`/api/weekly-recaps/${id}`, { method: "DELETE" }),
    onSuccess: async () => {
      toast.success("Weekly recap deleted.");
      setDeleteRecap(null);
      await invalidateRecaps();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <PageTransition>
    <div className="space-y-6">
      <PageHeader
        eyebrow="Admin Recaps"
        title="Weekly Recaps"
        description="Capture weekly statistics, lessons learned, and the next focus."
        action={
          <Button type="button" onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New recap
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Past Recaps</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="h-14 rounded-2xl bg-muted/50" />
              ))}
            </div>
          ) : isError ? (
            <ErrorState
              title="Recaps unavailable"
              description="There was a problem loading the recap table."
              onRetry={() => {
                void refetch();
              }}
            />
          ) : data?.recaps.length ? (
            <Table className="min-w-[640px] w-full">
              <TableHeader>
                <TableRow>
                  <TableHead>Week</TableHead>
                  <TableHead>Trades</TableHead>
                  <TableHead>Wins</TableHead>
                  <TableHead>Losses</TableHead>
                  <TableHead>Win Rate</TableHead>
                  <TableHead>P&amp;L</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.recaps.flatMap((recap) => {
                  const isExpanded = expandedRecapId === recap.id;

                  return [
                    <TableRow key={recap.id}>
                      <TableCell>
                        {format(new Date(recap.weekStartDate), "MMM d")} -{" "}
                        {format(new Date(recap.weekEndDate), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell>{recap.totalTrades}</TableCell>
                      <TableCell>{recap.wins}</TableCell>
                      <TableCell>{recap.losses}</TableCell>
                      <TableCell>{recap.winRate.toFixed(1)}%</TableCell>
                      <TableCell
                        className={
                          recap.totalPnlPercent >= 0
                            ? "text-[color:var(--color-green)]"
                            : "text-[color:var(--color-red)]"
                        }
                      >
                        {formatPercent(recap.totalPnlPercent)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setExpandedRecapId((current) =>
                                current === recap.id ? null : recap.id,
                              )
                            }
                          >
                            <ChevronDown className="mr-2 h-4 w-4" />
                            Expand
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingRecap(recap)}
                          >
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </Button>
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => setDeleteRecap(recap)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>,
                    isExpanded ? (
                      <TableRow key={`${recap.id}-expanded`}>
                        <TableCell colSpan={7}>
                          <div className="grid grid-cols-1 gap-4 rounded-2xl border border-border bg-muted/30 p-4 md:grid-cols-2">
                            <div>
                              <p className="text-sm font-medium">What we learned</p>
                              <p className="mt-2 text-sm text-muted-foreground">
                                {recap.whatWeLearned}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm font-medium">Next week focus</p>
                              <p className="mt-2 text-sm text-muted-foreground">
                                {recap.nextWeekFocus}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : null,
                  ];
                })}
              </TableBody>
            </Table>
          ) : (
            <EmptyState
              icon={<Plus className="h-12 w-12" />}
              title="No recaps yet"
              description="Create the first weekly recap to publish desk performance and lessons."
            />
          )}
        </CardContent>
      </Card>

      <Sheet open={createOpen} onOpenChange={setCreateOpen}>
        <SheetContent side="right" className="w-full max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Create recap</SheetTitle>
            <SheetDescription>
              Capture the week&apos;s stats, lessons, and next-week focus.
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6">
            <WeeklyRecapForm
              onSubmit={async (values) => {
                await createMutation.mutateAsync(values);
              }}
              isSubmitting={createMutation.isPending}
              submitLabel="Save recap"
            />
          </div>
        </SheetContent>
      </Sheet>

      <Sheet
        open={Boolean(editingRecap)}
        onOpenChange={(open) => {
          if (!open) {
            setEditingRecap(null);
          }
        }}
      >
        <SheetContent side="right" className="w-full max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Edit recap</SheetTitle>
            <SheetDescription>
              Update the recap details and save the revised summary.
            </SheetDescription>
          </SheetHeader>
          {editingRecap ? (
            <div className="mt-6">
              <WeeklyRecapForm
                initialValues={{
                  weekStartDate: new Date(editingRecap.weekStartDate).toISOString().slice(0, 10),
                  weekEndDate: new Date(editingRecap.weekEndDate).toISOString().slice(0, 10),
                  totalTrades: editingRecap.totalTrades,
                  wins: editingRecap.wins,
                  losses: editingRecap.losses,
                  winRate: editingRecap.winRate,
                  bestTrade: editingRecap.bestTrade,
                  worstTrade: editingRecap.worstTrade,
                  totalPnlPercent: editingRecap.totalPnlPercent,
                  whatWeLearned: editingRecap.whatWeLearned,
                  nextWeekFocus: editingRecap.nextWeekFocus,
                }}
                onSubmit={async (values) => {
                  await updateMutation.mutateAsync({
                    id: editingRecap.id,
                    payload: values,
                  });
                }}
                isSubmitting={
                  updateMutation.isPending && updateMutation.variables?.id === editingRecap.id
                }
                submitLabel="Save changes"
              />
            </div>
          ) : null}
        </SheetContent>
      </Sheet>

      <AlertDialog
        open={Boolean(deleteRecap)}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteRecap(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this recap?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the recap and cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteRecap) {
                  deleteMutation.mutate(deleteRecap.id);
                }
              }}
            >
              Delete recap
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
    </PageTransition>
  );
}
