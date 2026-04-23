import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  BookOpenText,
  Calculator,
  Compass,
  GraduationCap,
  LayoutGrid,
  LineChart,
  Megaphone,
  MessageSquare,
  Settings2,
  Shield,
  Send,
  Tags,
  Users,
  Zap,
} from "lucide-react";

export type NavigationItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  match?: "exact" | "prefix";
};

export const primaryNav: NavigationItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutGrid },
  { href: "/journal", label: "My Journal", icon: BookOpenText },
  { href: "/signals", label: "Signals", icon: Zap },
  { href: "/outlook", label: "Daily Outlook", icon: Compass },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/education", label: "Education", icon: GraduationCap },
  { href: "/calculator", label: "Calculator", icon: Calculator },
  { href: "/community", label: "Community", icon: Users, match: "exact" },
  { href: "/community/chat", label: "Chat", icon: MessageSquare, match: "prefix" },
  { href: "/watchlist", label: "Watchlist", icon: LineChart },
  { href: "/community/leaderboard", label: "Leaderboard", icon: BarChart3, match: "prefix" },
];

export const adminNav: NavigationItem = {
  href: "/admin",
  label: "Admin Panel",
  icon: Shield,
};

export const adminSubNav: NavigationItem[] = [
  { href: "/admin", label: "Overview", icon: LayoutGrid },
  { href: "/admin/members", label: "Members", icon: Users },
  { href: "/admin/signals", label: "Signals", icon: Zap },
  { href: "/admin/resources", label: "Resources", icon: BookOpenText },
  { href: "/admin/education", label: "Education", icon: GraduationCap },
  { href: "/admin/outlook", label: "Outlook", icon: Compass },
  { href: "/admin/recaps", label: "Recaps", icon: BarChart3 },
  { href: "/admin/announcements", label: "Announcements", icon: Megaphone },
  { href: "/admin/chat", label: "Chat", icon: MessageSquare },
  { href: "/admin/broadcast", label: "Broadcast", icon: Megaphone },
  { href: "/admin/wins", label: "Win Moderation", icon: Users },
  { href: "/admin/engagement", label: "Engagement", icon: BarChart3 },
  { href: "/admin/tags", label: "Trade Tags", icon: Tags },
  { href: "/admin/site-config", label: "Site Config", icon: Settings2 },
  { href: "/admin/audit-log", label: "Audit Log", icon: Shield },
  { href: "/admin/reports", label: "Reports", icon: Send },
];

export function isPathActive(
  pathname: string,
  href: string,
  match: NavigationItem["match"] = "prefix",
) {
  if (match === "exact") {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}
