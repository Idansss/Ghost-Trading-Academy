"use client";

import type { Resource } from "@prisma/client";
import { Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ResourceForm } from "@/components/admin/ResourceForm";
import { PageTransition } from "@/components/layout/PageTransition";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { PageHeader } from "@/components/shared/PageHeader";
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
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { fetchJson } from "@/lib/client-api";

export default function AdminResourcesPage() {
  const queryClient = useQueryClient();
  const [editingResource, setEditingResource] = useState<Resource | null>(null);
  const [deletingResourceId, setDeletingResourceId] = useState<string | null>(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["resources"],
    queryFn: () => fetchJson<{ resources: Resource[] }>("/api/resources"),
  });

  const invalidateResources = async () => {
    await queryClient.invalidateQueries({ queryKey: ["resources"] });
  };

  const createMutation = useMutation({
    mutationFn: (values: unknown) =>
      fetchJson("/api/resources", {
        method: "POST",
        body: JSON.stringify(values),
      }),
    onSuccess: async () => {
      toast.success("Resource uploaded successfully");
      await invalidateResources();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, values }: { id: string; values: unknown }) =>
      fetchJson(`/api/resources/${id}`, {
        method: "PATCH",
        body: JSON.stringify(values),
      }),
    onSuccess: async () => {
      toast.success("Resource updated.");
      setEditingResource(null);
      await invalidateResources();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const toggleVipMutation = useMutation({
    mutationFn: ({ resource, isVipOnly }: { resource: Resource; isVipOnly: boolean }) =>
      fetchJson(`/api/resources/${resource.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          title: resource.title,
          description: resource.description,
          type: resource.type,
          url: resource.url,
          fileKey: resource.fileKey,
          tag: resource.tag,
          isVipOnly,
          meta: resource.meta,
        }),
      }),
    onSuccess: async () => {
      await invalidateResources();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => fetchJson(`/api/resources/${id}`, { method: "DELETE" }),
    onSuccess: async () => {
      toast.success("Resource deleted.");
      setDeletingResourceId(null);
      await invalidateResources();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const deletingResource =
    data?.resources.find((resource) => resource.id === deletingResourceId) ?? null;

  return (
    <PageTransition>
    <div className="space-y-6">
      <PageHeader
        eyebrow="Admin Resources"
        title="Manage Education Resources"
        description="Add guides, PDF downloads, and video links for members."
      />

      <Card>
        <CardHeader>
          <CardTitle>Upload Resource</CardTitle>
        </CardHeader>
        <CardContent>
          <ResourceForm
            onSubmit={async (values) => {
              await createMutation.mutateAsync(values);
            }}
            isSubmitting={createMutation.isPending}
            submitLabel="Upload Resource"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Resource Library</CardTitle>
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
              title="Resources unavailable"
              description="There was a problem loading the resource table."
              onRetry={() => {
                void refetch();
              }}
            />
          ) : data?.resources.length ? (
            <Table className="min-w-[640px] w-full">
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Tag</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>VIP only</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.resources.map((resource) => {
                  const isPendingToggle =
                    toggleVipMutation.isPending &&
                    toggleVipMutation.variables?.resource.id === resource.id;

                  return (
                    <TableRow key={resource.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{resource.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {resource.description}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>{resource.type}</TableCell>
                      <TableCell>{resource.tag}</TableCell>
                      <TableCell className="max-w-[220px] truncate text-sm text-muted-foreground">
                        {resource.type === "PDF" ? resource.meta : resource.url}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Switch
                            checked={resource.isVipOnly}
                            disabled={isPendingToggle}
                            onCheckedChange={(checked) =>
                              toggleVipMutation.mutate({
                                resource,
                                isVipOnly: checked,
                              })
                            }
                          />
                          <span className="text-xs text-muted-foreground">
                            {isPendingToggle
                              ? "Updating..."
                              : resource.isVipOnly
                                ? "VIP"
                                : "Public"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingResource(resource)}
                          >
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </Button>
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => setDeletingResourceId(resource.id)}
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
          ) : (
            <EmptyState
              icon={<Pencil className="h-12 w-12" />}
              title="No resources yet"
              description="Upload your first education resource to populate the library."
            />
          )}
        </CardContent>
      </Card>

      <Sheet
        open={Boolean(editingResource)}
        onOpenChange={(open) => {
          if (!open) {
            setEditingResource(null);
          }
        }}
      >
        <SheetContent side="right" className="w-full max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Edit resource</SheetTitle>
            <SheetDescription>
              {editingResource?.type === "PDF"
                ? `Current file: ${editingResource.meta}`
                : editingResource?.type === "VIDEO"
                  ? `Current video URL: ${editingResource.url}`
                  : "Update the resource details and save your changes."}
            </SheetDescription>
          </SheetHeader>
          {editingResource ? (
            <div className="mt-6">
              <ResourceForm
                initialValues={editingResource}
                onSubmit={async (values) => {
                  await updateMutation.mutateAsync({
                    id: editingResource.id,
                    values,
                  });
                }}
                isSubmitting={updateMutation.isPending}
                submitLabel="Save changes"
              />
            </div>
          ) : null}
        </SheetContent>
      </Sheet>

      <AlertDialog
        open={Boolean(deletingResourceId)}
        onOpenChange={(open) => {
          if (!open) {
            setDeletingResourceId(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this resource?</AlertDialogTitle>
            <AlertDialogDescription>
              {deletingResource
                ? `This will permanently remove "${deletingResource.title}" from the education library.`
                : "This action cannot be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deletingResourceId) {
                  deleteMutation.mutate(deletingResourceId);
                }
              }}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete resource"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
    </PageTransition>
  );
}
