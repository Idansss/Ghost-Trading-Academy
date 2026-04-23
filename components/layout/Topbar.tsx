"use client";

import { LogOut, User as UserIcon } from "lucide-react";
import type { Session } from "next-auth";
import { signOut } from "next-auth/react";
import Link from "next/link";
import type { GlobalSearchItem } from "@/components/layout/GlobalSearch";
import { GlobalSearch } from "@/components/layout/GlobalSearch";
import { MobileHeader } from "@/components/layout/MobileHeader";
import { NotificationBell } from "@/components/layout/NotificationBell";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
  const displayEmail = user.email ?? "";
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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-auto rounded-2xl px-2 py-1">
                <div className="flex items-center gap-3">
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
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <div className="px-3 py-2">
                <p className="truncate text-sm font-medium">{displayName}</p>
                <p className="truncate text-xs text-muted-foreground">{displayEmail}</p>
              </div>
              <DropdownMenuItem asChild>
                <Link href="/profile" className="flex items-center gap-2">
                  <UserIcon className="h-4 w-4" />
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="flex items-center gap-2 text-destructive focus:text-destructive"
                onSelect={(event) => {
                  event.preventDefault();
                  void signOut({ redirectTo: "/auth/login" });
                }}
              >
                <LogOut className="h-4 w-4" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
    </div>
  );
}
