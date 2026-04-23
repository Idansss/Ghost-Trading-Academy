import Link from "next/link";
import { cn } from "@/lib/utils";

interface LandingCtaProps {
  label: string;
  href: string;
  size?: "default" | "lg";
  className?: string;
}

export function LandingCta({ label, href, size = "default", className }: LandingCtaProps) {
  const isExternal = href.startsWith("http");

  const cls = cn(
    "inline-flex items-center justify-center rounded-2xl bg-primary font-semibold text-primary-foreground transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
    size === "lg" ? "h-12 px-7 text-base" : "h-10 px-5 text-sm",
    className,
  );

  if (isExternal) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>
        {label}
      </a>
    );
  }

  return (
    <Link href={href} className={cls}>
      {label}
    </Link>
  );
}
