import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin Resources",
};

export default function AdminResourcesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
