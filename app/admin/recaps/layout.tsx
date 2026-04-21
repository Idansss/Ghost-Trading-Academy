import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin Recaps",
};

export default function AdminRecapsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
