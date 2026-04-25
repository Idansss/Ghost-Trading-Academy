"use client";

import { LogOut, Moon, SunMedium, User as UserIcon } from "lucide-react";
import type { Session } from "next-auth";
import { signOut } from "next-auth/react";
import { useTheme } from "next-themes";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { GlobalSearchItem } from "@/components/layout/GlobalSearch";
import { GlobalSearch } from "@/components/layout/GlobalSearch";
import { MobileHeader } from "@/components/layout/MobileHeader";
import { NotificationBell } from "@/components/layout/NotificationBell";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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

  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  const isDark = mounted ? resolvedTheme !== "light" : false;

  return (
    <div className="sticky top-0 z-30">
      <MobileHeader user={user} unreadCount={unreadCount} searchItems={searchItems} />
      <header className="hidden h-[4.5rem] items-center justify-between gap-3 border-b border-border bg-background/90 px-4 backdrop-blur sm:px-5 md:flex">
        <div className="flex max-w-[30rem] flex-1 items-center gap-2.5">
          <GlobalSearch items={searchItems} />
        </div>

        <div className="ml-auto flex items-center gap-1">
          <NotificationBell initialUnreadCount={unreadCount} />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user.avatarUrl ?? undefined} alt={displayName} />
                  <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <div className="px-3 py-2">
                <p className="truncate text-sm font-medium">{displayName}</p>
                <p className="truncate text-xs text-muted-foreground">{displayEmail}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/profile" className="flex items-center gap-2">
                  <UserIcon className="h-4 w-4" />
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="flex items-center gap-2"
                onSelect={(e) => { e.preventDefault(); setTheme(isDark ? "light" : "dark"); }}
              >
                {isDark ? <SunMedium className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                {isDark ? "Light mode" : "Dark mode"}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
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
