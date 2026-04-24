"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { NotificationItem } from "@/components/notifications/NotificationItem";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { fetchJson } from "@/lib/client-api";
import { cn } from "@/lib/utils";

type NotificationsResponse = {
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
      | "SYSTEM"
      | "NEW_ANNOUNCEMENT"
      | "DIRECT_MESSAGE"
      | "BROADCAST";
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

export function NotificationBell({
  initialUnreadCount,
}: {
  initialUnreadCount: number;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const previousUnreadCount = useRef(initialUnreadCount);
  const [open, setOpen] = useState(false);
  const [pulseBadge, setPulseBadge] = useState(false);

  const unreadCountQuery = useQuery({
    queryKey: ["notifications", "unread-count"],
    queryFn: () => fetchJson<{ unreadCount: number }>("/api/notifications?mode=count"),
    initialData: { unreadCount: initialUnreadCount },
    // Poll every 60s as a simple real-time fallback.
    refetchInterval: 60_000,
  });

  const notificationsQuery = useQuery({
    queryKey: ["notifications", "dropdown"],
    queryFn: () =>
      fetchJson<NotificationsResponse>("/api/notifications?page=1&filter=ALL"),
    enabled: open,
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

  useEffect(() => {
    const currentCount = unreadCountQuery.data?.unreadCount ?? 0;

    if (currentCount > previousUnreadCount.current) {
      setPulseBadge(true);
      const timeout = window.setTimeout(() => setPulseBadge(false), 1600);
      previousUnreadCount.current = currentCount;
      return () => window.clearTimeout(timeout);
    }

    previousUnreadCount.current = currentCount;
  }, [unreadCountQuery.data?.unreadCount]);

  const unreadCount = unreadCountQuery.data?.unreadCount ?? initialUnreadCount;
  const notifications = notificationsQuery.data?.notifications ?? [];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="relative h-9 w-9 rounded-xl"
        >
          <Bell className="h-4.5 w-4.5" />
          {unreadCount > 0 ? (
            <span
              className={cn(
                "absolute -right-1 -top-1 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-[color:var(--color-red)] px-1 text-[9px] font-semibold text-white",
                pulseBadge && "animate-pulse",
              )}
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          ) : null}
        </Button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-[340px] p-0">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h3 className="text-sm font-semibold">Notifications</h3>
          {unreadCount > 0 ? (
            <button
              type="button"
              className="text-xs font-medium text-primary hover:underline"
              onClick={() => markAllMutation.mutate()}
            >
              Mark all as read
            </button>
          ) : null}
        </div>

        <div className="max-h-[480px] overflow-y-auto p-2">
          {notifications.length ? (
            notifications.map((notification) => (
              <button
                key={notification.id}
                type="button"
                className="w-full rounded-2xl text-left hover:bg-accent/40"
                onClick={async () => {
                  if (!notification.isRead) {
                    await markOneMutation.mutateAsync(notification.id);
                  }

                  setOpen(false);

                  if (notification.link) {
                    router.push(notification.link);
                  }
                }}
              >
                <NotificationItem notification={notification} />
              </button>
            ))
          ) : (
            <div className="px-4 py-10 text-center text-sm text-muted-foreground">
              No notifications yet.
            </div>
          )}
        </div>

        <div className="border-t border-border px-4 py-3">
          <Link
            href="/notifications"
            className="text-sm font-medium text-primary hover:underline"
            onClick={() => setOpen(false)}
          >
            View all notifications
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}
