import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  BookOpenText,
  Calculator,
  Compass,
  GraduationCap,
  LayoutGrid,
  Shield,
  Users,
  Zap,
} from "lucide-react";

export type NavigationItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export const primaryNav: NavigationItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutGrid },
  { href: "/journal", label: "My Journal", icon: BookOpenText },
  { href: "/signals", label: "Signals", icon: Zap },
  { href: "/outlook", label: "Daily Outlook", icon: Compass },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/education", label: "Education", icon: GraduationCap },
  { href: "/calculator", label: "Calculator", icon: Calculator },
  { href: "/community", label: "Community", icon: Users },
];

export const adminNav: NavigationItem = {
  href: "/admin",
  label: "Admin Panel",
  icon: Shield,
};

export function isPathActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}
