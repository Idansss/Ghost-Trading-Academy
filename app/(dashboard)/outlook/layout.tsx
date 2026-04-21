import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Daily Outlook",
};

export default function OutlookLayout({ children }: { children: React.ReactNode }) {
  return children;
}
