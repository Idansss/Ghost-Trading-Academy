import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin Signals",
};

export default function AdminSignalsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
