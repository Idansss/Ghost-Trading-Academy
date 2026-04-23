import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

  const unreadCount = await prisma.notification.count({
    where: {
      userId: session.user.id,
      isRead: false,
    },
  });

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar user={session.user} />
      <div className="flex h-screen min-w-0 flex-1 flex-col overflow-hidden">
        <Topbar user={session.user} unreadCount={unreadCount} searchItems={[]} />
        <main className="flex-1 overflow-y-auto px-4 pb-16 pt-6 md:pb-6 sm:px-6 lg:px-8">{children}</main>
        <MobileBottomNav />
      </div>
    </div>
  );
}
