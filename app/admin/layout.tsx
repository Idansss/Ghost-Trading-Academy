import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { optionalPrismaQuery } from "@/server/core/prisma-schema";

export const metadata: Metadata = {
  title: "Admin",
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/login");
  }

  if (session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const unreadCount = await optionalPrismaQuery(
    "admin_layout_notification_count",
    () =>
      prisma.notification.count({
        where: {
          userId: session.user.id,
          isRead: false,
        },
      }),
    0,
  );

  return (
    <div
      data-app-shell="admin"
      className="flex h-dvh min-h-0 overflow-hidden bg-background"
    >
      <Sidebar user={session.user} />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <Topbar user={session.user} unreadCount={unreadCount} searchItems={[]} />
        <main className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-4 pt-5 pb-[calc(1rem+4rem+env(safe-area-inset-bottom))] sm:px-6 md:pt-6 md:pb-8 lg:px-8">
          {children}
        </main>
        <MobileBottomNav />
      </div>
    </div>
  );
}
