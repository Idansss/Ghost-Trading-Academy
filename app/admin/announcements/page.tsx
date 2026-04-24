"use client";

import type { Announcement, AnnouncementType } from "@prisma/client";
import { formatDistanceToNowStrict } from "date-fns";
import { Trash2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PageTransition } from "@/components/layout/PageTransition";
import { Breadcrumb } from "@/components/shared/Breadcrumb";
import { PageHeader } from "@/components/shared/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ErrorState } from "@/components/ui/ErrorState";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { fetchJson } from "@/lib/client-api";

const ANNOUNCEMENT_TYPES: AnnouncementType[] = [
  "INFO",
  "WARNING",
  "SIGNAL_UPDATE",
  "TP_HIT",
  "SL_HIT",
  "BREAKEVEN",
  "NEW_RESOURCE",
];

type FormValues = {
  title: string;
  message: string;
  type: AnnouncementType;
  isUrgent: boolean;
};

export default function AdminAnnouncementsPage() {
  const queryClient = useQueryClient();
  const [type, setType] = useState<AnnouncementType>("INFO");
  const [isUrgent, setIsUrgent] = useState(false);
  const form = useForm<FormValues>({
    defaultValues: { title: "", message: "", type: "INFO", isUrgent: false },
  });

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["announcements-admin"],
    queryFn: () => fetchJson<{ announcements: Announcement[] }>("/api/announcements"),
  });

  const createMutation = useMutation({
    mutationFn: (payload: FormValues) =>
      fetchJson<Announcement>("/api/announcements", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: (newAnnouncement) => {
      toast.success("Announcement posted.");
      queryClient.setQueryData<{ announcements: Announcement[] }>(
        ["announcements-admin"],
        (prev) => ({
          announcements: [newAnnouncement, ...(prev?.announcements ?? [])],
        }),
      );
      form.reset();
      setType("INFO");
      setIsUrgent(false);
    },
    onError: () => toast.error("Failed to post announcement."),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      fetchJson(`/api/announcements/${id}`, { method: "DELETE" }),
    onSuccess: (_, id) => {
      toast.success("Announcement deleted.");
      queryClient.setQueryData<{ announcements: Announcement[] }>(
        ["announcements-admin"],
        (prev) => ({
          announcements: (prev?.announcements ?? []).filter((a) => a.id !== id),
        }),
      );
    },
    onError: () => toast.error("Failed to delete announcement."),
  });

  const onSubmit = form.handleSubmit(async (values) => {
    await createMutation.mutateAsync({ ...values, type, isUrgent });
  });

  return (
    <PageTransition>
      <div className="space-y-6">
        <Breadcrumb items={[{ label: "Admin", href: "/admin" }, { label: "Announcements" }]} />
        <PageHeader
          eyebrow="Admin"
          title="Announcements"
          description="Compose and broadcast announcements to members."
        />

        <div className="grid gap-6 lg:grid-cols-[1fr_1.5fr]">
          <Card>
            <CardHeader>
              <CardTitle>New Announcement</CardTitle>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={onSubmit}>
                <div className="space-y-2">
                  <Label htmlFor="ann-title">Title</Label>
                  <Input
                    id="ann-title"
                    placeholder="e.g. BTC signal update"
                    {...form.register("title", { required: true })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ann-message">Message</Label>
                  <Textarea
                    id="ann-message"
                    placeholder="Full announcement content..."
                    rows={4}
                    {...form.register("message", { required: true })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ann-type">Type</Label>
                  <Select
                    value={type}
                    onValueChange={(v) => setType(v as AnnouncementType)}
                  >
                    <SelectTrigger id="ann-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ANNOUNCEMENT_TYPES.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t.replace("_", " ")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    id="ann-urgent"
                    type="checkbox"
                    title="Mark as urgent"
                    checked={isUrgent}
                    onChange={(e) => setIsUrgent(e.target.checked)}
                    className="h-4 w-4 accent-primary"
                  />
                  <Label htmlFor="ann-urgent" className="cursor-pointer">
                    Mark as urgent
                  </Label>
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={createMutation.isPending}
                >
                  {createMutation.isPending ? "Posting..." : "Post Announcement"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Past Announcements</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full rounded-2xl" />
                  ))}
                </div>
              ) : isError ? (
                <ErrorState
                  title="Could not load announcements"
                  description="There was a problem fetching announcements."
                  onRetry={() => void refetch()}
                />
              ) : data?.announcements.length ? (
                <div className="space-y-2">
                  {data.announcements.map((ann) => (
                    <div
                      key={ann.id}
                      className="flex items-start justify-between gap-3 rounded-2xl border border-border p-4"
                    >
                      <div className="min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-medium">{ann.title}</p>
                          {ann.isUrgent && <Badge variant="danger">Urgent</Badge>}
                          <Badge variant="muted">{ann.type.replace("_", " ")}</Badge>
                        </div>
                        <p className="line-clamp-2 text-xs text-muted-foreground">
                          {ann.message}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNowStrict(new Date(ann.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="shrink-0 text-muted-foreground hover:text-destructive"
                        disabled={deleteMutation.isPending}
                        onClick={() => deleteMutation.mutate(ann.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No announcements yet.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </PageTransition>
  );
}
