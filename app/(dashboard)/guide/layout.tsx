import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Platform Guide",
};

export default function GuideLayout({ children }: { children: React.ReactNode }) {
  return children;
}
