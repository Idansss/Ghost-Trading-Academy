"use client";

import type { Session } from "next-auth";
import { signOut } from "next-auth/react";
import Link from "next/link";
import { LogOut, Menu, User as UserIcon } from "lucide-react";
import { usePathname } from "next/navigation";
import { MobileSearch } from "@/components/layout/MobileSearch";
import type { GlobalSearchItem } from "@/components/layout/GlobalSearch";
import { NotificationBell } from "@/components/layout/NotificationBell";
import { adminNav, isPathActive, primaryNav } from "@/components/layout/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { MOBILE_HEADER_WORDMARK } from "@/lib/branding";
import { roleDisplayName } from "@/lib/role-display";
import { cn } from "@/lib/utils";

export function MobileHeader({
  user,
  unreadCount,
  searchItems = [],
}: {
  user: Session["user"];
  unreadCount: number;
  searchItems?: GlobalSearchItem[];
}) {
  const pathname = usePathname();
  const displayName = user.name ?? "Member";
  const displayEmail = user.email ?? "";
  const initials = displayName
    .split(" ")
    .slice(0, 2)
    .map((value) => value[0])
    .join("");
  const navItems = user.role === "ADMIN" ? [...primaryNav, adminNav] : primaryNav;

  return (
    <header className="flex h-16 items-center justify-between gap-3 border-b border-border bg-background/95 px-4 backdrop-blur md:hidden">
      <Sheet>
        <SheetTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-10 w-10"
            aria-label="Open navigation menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[88vw] max-w-[320px]">
          <SheetHeader>
            <SheetTitle>Navigation</SheetTitle>
            <SheetDescription>
              Move between member pages and account tools.
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 flex h-full flex-col">
            <nav className="space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = isPathActive(pathname, item.href, item.match);

                return (
                  <SheetClose asChild key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground",
                        active && "bg-primary/10 text-primary",
                      )}
                    >
                      <Icon className="h-5 w-5 shrink-0" />
                      <span>{item.label}</span>
                    </Link>
                  </SheetClose>
                );
              })}
            </nav>

            <div className="mt-auto rounded-3xl border border-border bg-[color:var(--bg-surface)] p-4">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage src={user.avatarUrl ?? undefined} alt={displayName} />
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{displayName}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {displayEmail}
                  </p>
                </div>
              </div>
              <div className="mt-3">
                <Badge variant={user.role === "MEMBER" ? "muted" : "default"}>
                  <span className="status-dot bg-current" />
                  {roleDisplayName(user.role)}
                </Badge>
              </div>
              <div className="mt-4 flex flex-col gap-2">
                <SheetClose asChild>
                  <Button asChild variant="outline" className="justify-start gap-2">
                    <Link href="/profile">
                      <UserIcon className="h-4 w-4" />
                      Profile
                    </Link>
                  </Button>
                </SheetClose>
                <Button
                  variant="ghost"
                  className="justify-start gap-2 text-destructive hover:text-destructive"
                  onClick={() => {
                    void signOut({ redirectTo: "/auth/login" });
                  }}
                >
                  <LogOut className="h-4 w-4" />
                  Log out
                </Button>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <p className="text-sm font-semibold tracking-[0.22em] text-[color:var(--color-gold)]">
        {MOBILE_HEADER_WORDMARK}
      </p>

      <div className="flex items-center gap-1">
        <MobileSearch items={searchItems} />
        <NotificationBell initialUnreadCount={unreadCount} />
        <Button asChild variant="ghost" size="icon" className="h-10 w-10 rounded-full">
          <Link href="/profile">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user.avatarUrl ?? undefined} alt={displayName} />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
          </Link>
        </Button>
      </div>
    </header>
  );
}
