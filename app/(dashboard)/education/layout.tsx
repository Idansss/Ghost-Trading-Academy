import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Education Hub",
};

export default function EducationLayout({ children }: { children: React.ReactNode }) {
  return children;
}
