"use client";

import {
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { motion } from "framer-motion";
import type { Session } from "next-auth";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { adminNav, isPathActive, primaryNav } from "@/components/layout/navigation";
import { Logo } from "@/components/shared/Logo";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function Sidebar({ user }: { user: Session["user"] }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const AdminIcon = adminNav.icon;
  const displayName = user.name ?? "Member";
  const displayEmail = user.email ?? "";
  const initials = displayName
    .split(" ")
    .slice(0, 2)
    .map((value) => value[0])
    .join("");

  return (
    <aside
      className={cn(
        "hidden h-screen flex-col border-r border-border bg-card/80 px-4 py-5 backdrop-blur md:flex",
        collapsed ? "w-[92px]" : "w-[280px]",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <Logo compact={collapsed} />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          onClick={() => setCollapsed((value) => !value)}
        >
          {collapsed ? (
            <PanelLeftOpen className="h-4 w-4" />
          ) : (
            <PanelLeftClose className="h-4 w-4" />
          )}
        </Button>
      </div>

      <nav className="mt-8 flex-1 space-y-2">
        {primaryNav.map((item) => {
          const active = isPathActive(pathname, item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex items-center gap-3 rounded-2xl px-4 py-3 text-sm text-muted-foreground transition-all hover:bg-accent hover:text-foreground",
                active && "bg-primary/10 text-primary",
                collapsed && "justify-center px-2",
              )}
            >
              {active ? (
                <motion.span
                  layoutId="sidebar-indicator"
                  className="absolute inset-y-1 left-0 w-1 rounded-r-full bg-primary"
                />
              ) : null}
              <Icon className="h-5 w-5 shrink-0" />
              {!collapsed ? <span>{item.label}</span> : null}
            </Link>
          );
        })}

        {user.role === "ADMIN" ? (
          <Link
            href={adminNav.href}
            className={cn(
              "mt-4 flex items-center gap-3 rounded-2xl border border-primary/20 bg-primary/10 px-4 py-3 text-sm text-primary transition hover:bg-primary/15",
              collapsed && "justify-center px-2",
            )}
          >
            <AdminIcon className="h-5 w-5 shrink-0" />
            {!collapsed ? <span>{adminNav.label}</span> : null}
          </Link>
        ) : null}
      </nav>

      <div className="surface-elevated rounded-3xl border border-border p-4">
        <div className={cn("flex items-center gap-3", collapsed && "justify-center")}>
          <Avatar>
            <AvatarImage src={user.avatarUrl ?? undefined} alt={displayName} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          {!collapsed ? (
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{displayName}</p>
              <p className="truncate text-xs text-muted-foreground">
                {displayEmail}
              </p>
            </div>
          ) : null}
        </div>
        {!collapsed ? (
          <div className="mt-3">
            <Badge
              variant={
                user.role === "VIP" || user.role === "ADMIN" ? "default" : "muted"
              }
            >
              <span className="status-dot bg-current" />
              {user.role === "ADMIN"
                ? "Admin"
                : user.role === "VIP"
                  ? "VIP"
                  : "Member"}
            </Badge>
          </div>
        ) : null}
      </div>
    </aside>
  );
}
