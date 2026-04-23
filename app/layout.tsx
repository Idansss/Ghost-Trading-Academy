import type { Metadata } from "next";
import type { CSSProperties } from "react";
import { Inter, JetBrains_Mono } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";
import { AppProviders } from "@/components/providers/AppProviders";
import { getSiteConfig } from "@/lib/site-config";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const siteConfig = await getSiteConfig();
  const platformName = siteConfig.platformName || "Ghost VIP";
  return {
    title: { default: platformName, template: `%s | ${platformName}` },
    description:
      "Professional trading signals, journal, education, and analytics for serious crypto traders.",
    icons: { icon: siteConfig.faviconUrl || "/favicon.ico" },
    manifest: "/manifest.json",
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const siteConfig = await getSiteConfig();
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} bg-background font-sans text-foreground antialiased`}
        style={{ "--color-primary": siteConfig.accentColor } as CSSProperties}
      >
        <AppProviders>{children}</AppProviders>
        <Toaster richColors position="bottom-right" closeButton />
      </body>
    </html>
  );
}
