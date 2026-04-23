"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import type { TradeTag } from "@prisma/client";
import { Pencil, Tags, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { z } from "zod";
import { PageTransition } from "@/components/layout/PageTransition";
import { Breadcrumb } from "@/components/shared/Breadcrumb";
import { PageHeader } from "@/components/shared/PageHeader";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { fetchJson } from "@/lib/client-api";
import { tradeTagSchema } from "@/lib/validators";

type TradeTagValues = z.infer<typeof tradeTagSchema>;

function TagForm({
  title,
  form,
  onSubmit,
  isSubmitting,
  submitLabel,
}: {
  title: string;
  form: ReturnType<typeof useForm<TradeTagValues>>;
  onSubmit: (values: TradeTagValues) => Promise<void>;
  isSubmitting: boolean;
  submitLabel: string;
}) {
  const colorValue = form.watch("color");

  return (
    <form
      className="space-y-4"
      onSubmit={form.handleSubmit(async (values) => {
        await onSubmit(values);
      })}
    >
      <div className="space-y-2">
        <Label>{title}</Label>
        <Input {...form.register("name")} placeholder="Breakout" />
        {form.formState.errors.name ? (
          <p className="text-xs text-[color:var(--color-red)]">{form.formState.errors.name.message}</p>
        ) : null}
      </div>
      <div className="space-y-2">
        <Label>Color</Label>
        <div className="flex items-center gap-3">
          <Input
            type="color"
            className="h-12 w-16 p-2"
            value={colorValue}
            onChange={(event) =>
              form.setValue("color", event.target.value, {
                shouldDirty: true,
                shouldTouch: true,
                shouldValidate: true,
              })
            }
          />
          <Input {...form.register("color")} placeholder="#B8860B" />
        </div>
        {form.formState.errors.color ? (
          <p className="text-xs text-[color:var(--color-red)]">{form.formState.errors.color.message}</p>
        ) : null}
      </div>
      <Button disabled={isSubmitting}>{isSubmitting ? "Saving..." : submitLabel}</Button>
    </form>
  );
}

export default function AdminTagsPage() {
  const queryClient = useQueryClient();
  const [editingTag, setEditingTag] = useState<TradeTag | null>(null);

  const createForm = useForm<TradeTagValues>({
    resolver: zodResolver(tradeTagSchema),
    defaultValues: {
      name: "",
      color: "#888888",
    },
  });

  const editForm = useForm<TradeTagValues>({
    resolver: zodResolver(tradeTagSchema),
    defaultValues: {
      name: "",
      color: "#888888",
    },
  });

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["admin-trade-tags"],
    queryFn: () => fetchJson<{ tags: TradeTag[] }>("/api/admin/tags"),
  });

  useEffect(() => {
    if (!editingTag) {
      return;
    }

    editForm.reset({
      name: editingTag.name,
      color: editingTag.color,
    });
  }, [editForm, editingTag]);

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: ["admin-trade-tags"] });
    await queryClient.invalidateQueries({ queryKey: ["trade-tags"] });
  };

  const createTag = useMutation({
    mutationFn: (payload: TradeTagValues) =>
      fetchJson<TradeTag>("/api/admin/tags", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: async () => {
      toast.success("Trade tag created.");
      createForm.reset({ name: "", color: "#888888" });
      await invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const updateTag = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: TradeTagValues }) =>
      fetchJson<TradeTag>(`/api/admin/tags/${id}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      }),
    onSuccess: async () => {
      toast.success("Trade tag updated.");
      setEditingTag(null);
      await invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const deleteTag = useMutation({
    mutationFn: (id: string) =>
      fetchJson<{ ok: true }>(`/api/admin/tags/${id}`, {
        method: "DELETE",
      }),
    onSuccess: async () => {
      toast.success("Trade tag deleted.");
      await invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  if (isError) {
    return (
      <ErrorState
        title="Trade tags unavailable"
        description="There was a problem loading the trade tag settings."
        onRetry={() => {
          void refetch();
        }}
      />
    );
  }

  return (
    <PageTransition>
      <div className="space-y-6">
        <Breadcrumb items={[{ label: "Admin", href: "/admin" }, { label: "Trade Tags" }]} />
        <PageHeader
          eyebrow="Admin"
          title="Trade Tags"
          description="Manage the tag options members can apply to journal entries and analytics filters."
        />

        <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
          <Card>
            <CardHeader>
              <CardTitle>Create Tag</CardTitle>
            </CardHeader>
            <CardContent>
              <TagForm
                title="Tag name"
                form={createForm}
                onSubmit={async (values) => {
                  await createTag.mutateAsync(values);
                }}
                isSubmitting={createTag.isPending}
                submitLabel="Add tag"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Available Tags</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="space-y-3 p-6">
                  {Array.from({ length: 6 }).map((_, index) => (
                    <div key={index} className="h-14 rounded-2xl bg-muted/50" />
                  ))}
                </div>
              ) : data?.tags.length ? (
                <div className="overflow-x-auto">
                  <div className="min-w-max px-6 pb-6">
                    <Table className="min-w-[560px] w-full">
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Color</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {data.tags.map((tag) => (
                          <TableRow key={tag.id}>
                            <TableCell className="font-medium">{tag.name}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <span
                                  className="h-4 w-4 rounded-full border border-border"
                                  style={{ backgroundColor: tag.color }}
                                />
                                <span>{tag.color}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setEditingTag(tag)}
                                >
                                  <Pencil className="mr-2 h-4 w-4" />
                                  Edit
                                </Button>
                                <Button
                                  type="button"
                                  variant="destructive"
                                  size="sm"
                                  disabled={deleteTag.isPending}
                                  onClick={() => deleteTag.mutate(tag.id)}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              ) : (
                <div className="p-6">
                  <EmptyState
                    icon={<Tags className="h-12 w-12" />}
                    title="No trade tags yet"
                    description="Create your first tag to give members structured journal context."
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Dialog
          open={Boolean(editingTag)}
          onOpenChange={(open) => {
            if (!open) {
              setEditingTag(null);
            }
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit trade tag</DialogTitle>
              <DialogDescription>
                Update the label and color used across the journal and analytics filters.
              </DialogDescription>
            </DialogHeader>
            <TagForm
              title="Tag name"
              form={editForm}
              onSubmit={async (values) => {
                if (!editingTag) return;
                await updateTag.mutateAsync({ id: editingTag.id, payload: values });
              }}
              isSubmitting={updateTag.isPending}
              submitLabel="Save changes"
            />
          </DialogContent>
        </Dialog>
      </div>
    </PageTransition>
  );
}
