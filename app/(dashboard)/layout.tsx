import { redirect } from "next/navigation";
import { LivePriceTicker } from "@/components/dashboard/LivePriceTicker";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import type { GlobalSearchItem } from "@/components/layout/GlobalSearch";
import { adminNav, primaryNav } from "@/components/layout/navigation";
import { PushPermissionPrompt } from "@/components/notifications/PushPermissionPrompt";
import { AddToHomeScreenPrompt } from "@/components/pwa/AddToHomeScreenPrompt";
import { auth } from "@/lib/auth";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { getSiteConfig } from "@/lib/site-config";
import { optionalPrismaQuery } from "@/server/core/prisma-schema";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/login");
  }

  const unreadCount = await optionalPrismaQuery(
    "dashboard_layout_notification_count",
    () =>
      prisma.notification.count({
        where: {
          userId: session.user.id,
          isRead: false,
        },
      }),
    0,
  );
  const siteConfig = await getSiteConfig();
  if (siteConfig.maintenanceMode && session.user.role !== "ADMIN") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-6">
        <div className="max-w-xl rounded-2xl border border-border bg-card p-8 text-center">
          <h1 className="text-2xl font-semibold">{siteConfig.platformName} is under maintenance</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            {siteConfig.maintenanceMessage || "We are applying updates and will be back shortly."}
          </p>
        </div>
      </div>
    );
  }
  const [recentSignals, recentResources, recentTrades, recentAnnouncements] =
    await Promise.all([
      prisma.signal.findMany({
        orderBy: { postedAt: "desc" },
        take: 6,
      }),
      prisma.resource.findMany({
        orderBy: { uploadedAt: "desc" },
        take: 6,
      }),
      prisma.trade.findMany({
        where: { userId: session.user.id },
        orderBy: { tradeDate: "desc" },
        take: 5,
        select: {
          id: true,
          coin: true,
          direction: true,
          outcome: true,
          setupType: true,
        },
      }),
      prisma.announcement.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
    ]);

  const navItems = session.user.role === "ADMIN" ? [...primaryNav, adminNav] : primaryNav;
  const searchItems: GlobalSearchItem[] = [
    ...navItems.map((item) => ({
      id: `nav-${item.href}`,
      title: item.label,
      subtitle: `Open ${item.label.toLowerCase()}.`,
      href: item.href,
      section: "Page",
    })),
    ...recentSignals.map((signal) => ({
      id: `signal-${signal.id}`,
      title: `${signal.coin} ${signal.direction}`,
      subtitle: `${signal.status} setup on ${signal.timeframe} | Entry ${signal.entryZone}`,
      href: "/signals",
      section: "Signal",
    })),
    ...recentResources.map((resource) => ({
      id: `resource-${resource.id}`,
      title: resource.title,
      subtitle: `${resource.type} resource | ${resource.tag}`,
      href: "/education",
      section: "Resource",
    })),
    ...recentTrades.map((trade) => ({
      id: `trade-${trade.id}`,
      title: `${trade.coin} ${trade.direction}`,
      subtitle: `${trade.outcome} trade | ${trade.setupType}`,
      href: "/journal",
      section: "Trade",
    })),
    ...recentAnnouncements.map((announcement) => ({
      id: `announcement-${announcement.id}`,
      title: announcement.title,
      subtitle: announcement.message,
      href: "/community",
      section: "Update",
    })),
  ];

  return (
    <div
      data-app-shell="dashboard"
      className="flex h-dvh min-h-0 overflow-hidden bg-background"
    >
      <Sidebar user={session.user} />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <Topbar user={session.user} unreadCount={unreadCount} searchItems={searchItems} />
        {session.user.role !== "ADMIN" ? (
          <PushPermissionPrompt appId={env.onesignalAppId} userId={session.user.id} />
        ) : null}
        <LivePriceTicker symbols={siteConfig.tickerSymbols} />
        <main className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain bg-[color:var(--bg-surface)] px-4 pt-5 pb-[calc(1rem+4rem+env(safe-area-inset-bottom))] sm:px-6 md:pt-6 md:pb-8 lg:px-8">
          {children}
        </main>
        <AddToHomeScreenPrompt />
        <MobileBottomNav />
      </div>
    </div>
  );
}
