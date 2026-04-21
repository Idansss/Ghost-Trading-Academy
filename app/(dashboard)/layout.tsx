import { redirect } from "next/navigation";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { Sidebar } from "@/components/layout/Sidebar";
import { SubscriptionBanner } from "@/components/layout/SubscriptionBanner";
import { Topbar } from "@/components/layout/Topbar";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/login");
  }

  const unreadCount = await prisma.notification.count({
    where: {
      userId: session.user.id,
      isRead: false,
    },
  });

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar user={session.user} />
      <div className="flex min-h-screen flex-1 flex-col">
        <Topbar user={session.user} unreadCount={unreadCount} />
        <SubscriptionBanner user={session.user} />
        <main className="flex-1 px-4 pb-16 pt-6 md:pb-0 sm:px-6 lg:px-8">{children}</main>
        <MobileBottomNav />
      </div>
    </div>
  );
}
