import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin Members",
};

export default function AdminMembersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
