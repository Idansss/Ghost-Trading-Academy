import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin Outlook",
};

export default function AdminOutlookLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
