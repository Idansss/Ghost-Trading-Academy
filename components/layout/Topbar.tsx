"use client";

import type { Session } from "next-auth";
import Link from "next/link";
import type { GlobalSearchItem } from "@/components/layout/GlobalSearch";
import { GlobalSearch } from "@/components/layout/GlobalSearch";
import { MobileHeader } from "@/components/layout/MobileHeader";
import { NotificationBell } from "@/components/layout/NotificationBell";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function Topbar({
  user,
  unreadCount,
  searchItems,
}: {
  user: Session["user"];
  unreadCount: number;
  searchItems: GlobalSearchItem[];
}) {
  const displayName = user.name ?? "Member";
  const initials = displayName
    .split(" ")
    .slice(0, 2)
    .map((value) => value[0])
    .join("");

  return (
    <div className="sticky top-0 z-30">
      <MobileHeader user={user} unreadCount={unreadCount} searchItems={searchItems} />
      <header className="hidden h-20 items-center justify-between gap-4 border-b border-border bg-background/90 px-4 backdrop-blur sm:px-6 md:flex">
        <div className="flex max-w-md flex-1 items-center gap-3">
          <GlobalSearch items={searchItems} />
        </div>

        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
          <NotificationBell initialUnreadCount={unreadCount} />
          <Button asChild variant="ghost" className="h-auto rounded-2xl px-2 py-1">
            <Link href="/profile" className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={user.avatarUrl ?? undefined} alt={displayName} />
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <div className="hidden text-left sm:block">
                <p className="text-sm font-medium">{displayName}</p>
                <Badge
                  variant={user.role === "MEMBER" ? "muted" : "default"}
                  className="mt-1"
                >
                  <span className="status-dot bg-current" />
                  {user.role}
                </Badge>
              </div>
            </Link>
          </Button>
        </div>
      </header>
    </div>
  );
}
