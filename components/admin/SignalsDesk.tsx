"use client";

import type { Signal } from "@prisma/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Copy, Pencil, Target, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { PostSignalForm } from "@/components/signals/PostSignalForm";
import { UpdateSignalOutcomeForm } from "@/components/signals/UpdateSignalOutcomeForm";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useSignalMutations, useSignals } from "@/hooks/useSignals";
import { fetchJson } from "@/lib/client-api";
import { getSignalStatusVariant } from "@/lib/signal-performance";

export function SignalsDesk() {
  const queryClient = useQueryClient();
  const [editingSignal, setEditingSignal] = useState<Signal | null>(null);
  const [outcomeSignal, setOutcomeSignal] = useState<Signal | null>(null);
  const [deletingSignalId, setDeletingSignalId] = useState<string | null>(null);
  const { data, isLoading, isError, refetch } = useSignals("ALL");
  const { createSignal, updateSignal, deleteSignal } = useSignalMutations();

  const duplicateMutation = useMutation({
    mutationFn: (signal: Signal) =>
      fetchJson("/api/signals", {
        method: "POST",
        body: JSON.stringify({
          coin: signal.coin,
          direction: signal.direction,
          entryZone: signal.entryZone,
          stopLoss: signal.stopLoss,
          tp1: signal.tp1,
          tp2: signal.tp2,
          tp3: signal.tp3,
          riskLevel: signal.riskLevel,
          timeframe: signal.timeframe,
          rrRatio: signal.rrRatio,
          reasoning: signal.reasoning,
          status: "ACTIVE",
          isVipOnly: signal.isVipOnly,
        }),
      }),
    onSuccess: async () => {
      toast.success("Signal duplicated");
      await queryClient.invalidateQueries({ queryKey: ["signals"] });
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const deletingSignal = data?.signals.find((signal) => signal.id === deletingSignalId) ?? null;

  return (
    <div id="signals-admin-desk" className="space-y-6">
      <Card id="signals-admin-create">
        <CardHeader>
          <CardTitle>Admin Signal Desk</CardTitle>
          <CardDescription>
            Publish new setups and manage active trade ideas without leaving the live signals page.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PostSignalForm
            withCard={false}
            onSubmit={async (values) => {
              await createSignal.mutateAsync(values);
            }}
            isSubmitting={createSignal.isPending}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Posted Signals</CardTitle>
          <CardDescription>
            Update outcomes, edit details, duplicate setups, or remove stale ideas from the desk.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-3 p-6">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="h-14 rounded-2xl bg-muted/50" />
              ))}
            </div>
          ) : isError ? (
            <div className="p-6">
              <ErrorState
                title="Signals unavailable"
                description="There was a problem loading the admin signals table."
                onRetry={() => {
                  void refetch();
                }}
              />
            </div>
          ) : data?.signals.length ? (
            <div className="overflow-x-auto">
              <div className="min-w-max px-6 pb-6">
                <Table className="min-w-[640px] w-full">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Pair</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Timeframe</TableHead>
                      <TableHead>Direction</TableHead>
                      <TableHead>VIP</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.signals.map((signal) => {
                      const isDuplicating =
                        duplicateMutation.isPending && duplicateMutation.variables?.id === signal.id;

                      return (
                        <TableRow key={signal.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{signal.coin}</p>
                              <p className="text-xs text-muted-foreground">{signal.entryZone}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={getSignalStatusVariant(signal.status)}>
                              {signal.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{signal.timeframe}</TableCell>
                          <TableCell>
                            <Badge variant={signal.direction === "LONG" ? "success" : "danger"}>
                              <span className="status-dot bg-current" />
                              {signal.direction}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={signal.isVipOnly ? "default" : "muted"}>
                              <span className="status-dot bg-current" />
                              {signal.isVipOnly ? "VIP" : "Public"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setOutcomeSignal(signal)}
                              >
                                <Target className="mr-2 h-4 w-4" />
                                Update Outcome
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setEditingSignal(signal)}
                              >
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={isDuplicating}
                                onClick={() => duplicateMutation.mutate(signal)}
                              >
                                <Copy className="mr-2 h-4 w-4" />
                                {isDuplicating ? "Copying..." : "Copy"}
                              </Button>
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                onClick={() => setDeletingSignalId(signal.id)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          ) : (
            <div className="p-6">
              <EmptyState
                icon={<Pencil className="h-12 w-12" />}
                title="No signals posted yet"
                description="Create your first signal to populate the live signals page."
              />
            </div>
          )}
        </CardContent>
      </Card>

      <Sheet
        open={Boolean(editingSignal)}
        onOpenChange={(open) => {
          if (!open) {
            setEditingSignal(null);
          }
        }}
      >
        <SheetContent side="right" className="w-full max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Edit signal</SheetTitle>
            <SheetDescription>
              Update the signal details, status, and VIP visibility.
            </SheetDescription>
          </SheetHeader>
          {editingSignal ? (
            <div className="mt-6">
              <PostSignalForm
                initialValues={editingSignal}
                withCard={false}
                submitLabel="Save changes"
                onSubmit={async (values) => {
                  await updateSignal.mutateAsync({
                    id: editingSignal.id,
                    payload: values,
                  });
                  setEditingSignal(null);
                }}
                isSubmitting={
                  updateSignal.isPending && updateSignal.variables?.id === editingSignal.id
                }
              />
            </div>
          ) : null}
        </SheetContent>
      </Sheet>

      <Sheet
        open={Boolean(outcomeSignal)}
        onOpenChange={(open) => {
          if (!open) {
            setOutcomeSignal(null);
          }
        }}
      >
        <SheetContent side="right" className="w-full max-w-xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Update outcome</SheetTitle>
            <SheetDescription>
              Mark target progression, stop loss, and the final result for track-record accuracy.
            </SheetDescription>
          </SheetHeader>
          {outcomeSignal ? (
            <div className="mt-6">
              <UpdateSignalOutcomeForm
                signal={outcomeSignal}
                isSubmitting={
                  updateSignal.isPending && updateSignal.variables?.id === outcomeSignal.id
                }
                onSubmit={async (values) => {
                  await updateSignal.mutateAsync({
                    id: outcomeSignal.id,
                    payload: values,
                  });
                  setOutcomeSignal(null);
                }}
              />
            </div>
          ) : null}
        </SheetContent>
      </Sheet>

      <AlertDialog
        open={Boolean(deletingSignalId)}
        onOpenChange={(open) => {
          if (!open) {
            setDeletingSignalId(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this signal?</AlertDialogTitle>
            <AlertDialogDescription>
              {deletingSignal
                ? `This cannot be undone and will remove the ${deletingSignal.coin} signal from the desk.`
                : "This cannot be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deletingSignalId) {
                  deleteSignal.mutate(deletingSignalId);
                  setDeletingSignalId(null);
                }
              }}
            >
              Delete signal
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
