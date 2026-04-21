import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Calculator",
};

export default function CalculatorLayout({ children }: { children: React.ReactNode }) {
  return children;
}
