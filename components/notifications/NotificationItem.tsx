"use client";

import type { NotificationType } from "@prisma/client";
import type { ComponentType } from "react";
import {
  BarChart3,
  BellRing,
  Bolt,
  CheckCircle2,
  Cog,
  FileText,
  Megaphone,
  MinusCircle,
  XCircle,
} from "lucide-react";
import { cn, fromNow } from "@/lib/utils";

const notificationTypeMap: Record<
  NotificationType,
  {
    icon: ComponentType<{ className?: string }>;
    iconClassName: string;
  }
> = {
  NEW_SIGNAL: {
    icon: Bolt,
    iconClassName: "text-[color:var(--color-gold)]",
  },
  TP_HIT: {
    icon: CheckCircle2,
    iconClassName: "text-[color:var(--color-green)]",
  },
  SL_HIT: {
    icon: XCircle,
    iconClassName: "text-[color:var(--color-red)]",
  },
  BREAKEVEN: {
    icon: MinusCircle,
    iconClassName: "text-muted-foreground",
  },
  NEW_RESOURCE: {
    icon: FileText,
    iconClassName: "text-[color:var(--color-blue)]",
  },
  WEEKLY_RECAP: {
    icon: BarChart3,
    iconClassName: "text-[color:var(--color-blue)]",
  },
  ANNOUNCEMENT: {
    icon: Megaphone,
    iconClassName: "text-[color:var(--color-gold)]",
  },
  SIGNAL_UPDATE: {
    icon: Bolt,
    iconClassName: "text-[color:var(--color-gold)]",
  },
  NEW_ANNOUNCEMENT: {
    icon: Megaphone,
    iconClassName: "text-[color:var(--color-gold)]",
  },
  NEW_RECAP: {
    icon: BarChart3,
    iconClassName: "text-[color:var(--color-blue)]",
  },
  WIN_APPROVED: {
    icon: CheckCircle2,
    iconClassName: "text-[color:var(--color-green)]",
  },
  STREAK_REMINDER: {
    icon: BellRing,
    iconClassName: "text-[color:var(--color-gold)]",
  },
  WEEKLY_REVIEW_READY: {
    icon: FileText,
    iconClassName: "text-[color:var(--color-blue)]",
  },
  LEADERBOARD_UPDATE: {
    icon: BarChart3,
    iconClassName: "text-[color:var(--color-blue)]",
  },
  BROADCAST: {
    icon: Megaphone,
    iconClassName: "text-[color:var(--color-gold)]",
  },
  DIRECT_MESSAGE: {
    icon: BellRing,
    iconClassName: "text-[color:var(--color-gold)]",
  },
  SYSTEM: {
    icon: Cog,
    iconClassName: "text-muted-foreground",
  },
};

export function NotificationItem({
  notification,
  truncate = true,
  className,
}: {
  notification: {
    id: string;
    type: NotificationType;
    title: string;
    message: string;
    isRead: boolean;
    createdAt: Date | string;
  };
  truncate?: boolean;
  className?: string;
}) {
  const visual = notificationTypeMap[notification.type] ?? {
    icon: BellRing,
    iconClassName: "text-muted-foreground",
  };
  const Icon = visual.icon;

  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-2xl px-3 py-3 text-left transition-colors",
        !notification.isRead && "bg-[color:var(--bg-elevated)]",
        className,
      )}
    >
      <div className="mt-0.5 rounded-xl bg-background/80 p-2">
        <Icon className={cn("h-4 w-4", visual.iconClassName)} />
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground">{notification.title}</p>
        <p
          className={cn(
            "mt-1 text-sm text-muted-foreground",
            truncate && "line-clamp-2",
          )}
        >
          {notification.message}
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          {fromNow(notification.createdAt)}
        </p>
      </div>

      {!notification.isRead ? (
        <span className="mt-2 h-2 w-2 rounded-full bg-[color:var(--color-gold)]" />
      ) : null}
    </div>
  );
}
