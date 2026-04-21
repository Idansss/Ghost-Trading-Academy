import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Journal",
};

export default function JournalLayout({ children }: { children: React.ReactNode }) {
  return children;
}
