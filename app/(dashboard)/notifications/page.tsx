"use client";

import { BellOff } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { PageTransition } from "@/components/layout/PageTransition";
import { NotificationItem } from "@/components/notifications/NotificationItem";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { fetchJson } from "@/lib/client-api";

type NotificationFilter = "ALL" | "UNREAD" | "SIGNALS" | "RESOURCES" | "RECAPS";

type NotificationsPageResponse = {
  notifications: Array<{
    id: string;
    userId: string;
    type:
      | "NEW_SIGNAL"
      | "TP_HIT"
      | "SL_HIT"
      | "BREAKEVEN"
      | "NEW_RESOURCE"
      | "WEEKLY_RECAP"
      | "ANNOUNCEMENT"
      | "SYSTEM";
    title: string;
    message: string;
    isRead: boolean;
    link: string | null;
    createdAt: string;
  }>;
  unreadCount: number;
  total: number;
  page: number;
  totalPages: number;
};

const filters: Array<{ label: string; value: NotificationFilter }> = [
  { label: "All", value: "ALL" },
  { label: "Unread", value: "UNREAD" },
  { label: "Signals", value: "SIGNALS" },
  { label: "Resources", value: "RESOURCES" },
  { label: "Recaps", value: "RECAPS" },
];

export default function NotificationsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<NotificationFilter>("ALL");
  const [page, setPage] = useState(1);

  const notificationsQuery = useQuery({
    queryKey: ["notifications", "page", filter, page],
    queryFn: () =>
      fetchJson<NotificationsPageResponse>(
        `/api/notifications?page=${page}&filter=${filter}`,
      ),
  });

  const markOneMutation = useMutation({
    mutationFn: (notificationId: string) =>
      fetchJson("/api/notifications", {
        method: "PATCH",
        body: JSON.stringify({ notificationId }),
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const markAllMutation = useMutation({
    mutationFn: () =>
      fetchJson("/api/notifications", {
        method: "PATCH",
        body: JSON.stringify({ markAllRead: true }),
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const data = notificationsQuery.data;

  if (notificationsQuery.isError) {
    return (
      <PageTransition>
      <div className="space-y-6">
        <PageHeader
          eyebrow="Notifications"
          title="Notification Center"
          description="Track signals, targets, resources, recaps, and desk announcements."
        />
        <ErrorState
          title="Notifications unavailable"
          description="There was a problem loading your notifications."
          onRetry={() => {
            void notificationsQuery.refetch();
          }}
        />
      </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
    <div className="space-y-6">
      <PageHeader
        eyebrow="Notifications"
        title="Notification Center"
        description="Track signals, targets, resources, recaps, and desk announcements."
        action={
          data?.unreadCount ? (
            <Button variant="outline" onClick={() => markAllMutation.mutate()}>
              Mark all as read
            </Button>
          ) : undefined
        }
      />

      <div className="flex flex-wrap gap-2">
        {filters.map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => {
              setFilter(item.value);
              setPage(1);
            }}
            className={`rounded-xl border px-4 py-2 text-sm font-medium transition-colors ${
              filter === item.value
                ? "border-[color:var(--color-gold)] bg-[color:var(--color-gold-light)] text-[color:var(--color-gold)]"
                : "border-border text-muted-foreground hover:bg-accent"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {data?.notifications.length ? (
        <div className="space-y-3">
          {data.notifications.map((notification) => (
            <button
              key={notification.id}
              type="button"
              className="w-full rounded-2xl border border-border bg-card text-left hover:bg-accent/40"
              onClick={async () => {
                if (!notification.isRead) {
                  await markOneMutation.mutateAsync(notification.id);
                }

                if (notification.link) {
                  router.push(notification.link);
                }
              }}
            >
              <NotificationItem notification={notification} truncate={false} />
            </button>
          ))}

          <div className="flex items-center justify-between border-t border-border pt-3">
            <Button
              variant="outline"
              disabled={page <= 1}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
            >
              Previous
            </Button>
            <p className="text-sm text-muted-foreground">
              Page {data.page} of {data.totalPages}
            </p>
            <Button
              variant="outline"
              disabled={page >= data.totalPages}
              onClick={() =>
                setPage((current) => Math.min(data.totalPages, current + 1))
              }
            >
              Next
            </Button>
          </div>
        </div>
      ) : (
        <EmptyState
          icon={
            <div className="relative">
              <BellOff />
              <span className="absolute -right-2 -top-2 text-xs font-semibold">z</span>
            </div>
          }
          title="All caught up"
          description="No notifications yet. You'll see signal alerts, TP hits, and updates here."
        />
      )}
    </div>
    </PageTransition>
  );
}
