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
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function Sidebar({ user }: { user: Session["user"] }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const AdminIcon = adminNav.icon;

  return (
    <aside
      className={cn(
        "hidden h-full flex-col border-r border-border bg-card/80 px-3 py-4 backdrop-blur md:flex",
        collapsed ? "w-20" : "w-64",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <Logo compact={collapsed} />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-xl"
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

      <nav className="mt-6 flex-1 space-y-1.5">
        {primaryNav.map((item) => {
          const active = isPathActive(pathname, item.href, item.match);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-muted-foreground transition-all hover:bg-accent hover:text-foreground",
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
              <Icon className="h-4 w-4 shrink-0" />
              {!collapsed ? <span>{item.label}</span> : null}
            </Link>
          );
        })}

        {user.role === "ADMIN" ? (
          <Link
            href={adminNav.href}
            className={cn(
              "mt-3 flex items-center gap-2.5 rounded-xl border border-primary/20 bg-primary/10 px-3 py-2.5 text-sm text-primary transition hover:bg-primary/15",
              collapsed && "justify-center px-2",
            )}
          >
            <AdminIcon className="h-4 w-4 shrink-0" />
            {!collapsed ? <span>{adminNav.label}</span> : null}
          </Link>
        ) : null}
      </nav>
    </aside>
  );
}
