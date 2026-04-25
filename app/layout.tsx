import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import { AppProviders } from "@/components/providers/AppProviders";
import { DEFAULT_PLATFORM_NAME } from "@/lib/branding";
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

// CLAUDE IMPROVEMENT: Added complete Open Graph + Twitter card meta tags so
// shares on social media render a proper preview instead of a blank card.
export async function generateMetadata(): Promise<Metadata> {
  const siteConfig = await getSiteConfig();
  const platformName = siteConfig.platformName || DEFAULT_PLATFORM_NAME;
  const description =
    "Professional trading signals, journal, education, and analytics for serious crypto traders.";
  const faviconUrl = siteConfig.faviconUrl || "/brand/logo.png";

  return {
    title: { default: platformName, template: `%s | ${platformName}` },
    description,
    icons: {
      icon: faviconUrl,
      apple: faviconUrl,
    },
    manifest: "/manifest.json",
    openGraph: {
      type: "website",
      siteName: platformName,
      title: platformName,
      description,
      images: [{ url: faviconUrl, width: 512, height: 512, alt: platformName }],
    },
    twitter: {
      card: "summary",
      title: platformName,
      description,
      images: [faviconUrl],
    },
    metadataBase: process.env.NEXT_PUBLIC_APP_URL
      ? new URL(process.env.NEXT_PUBLIC_APP_URL)
      : undefined,
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
      {/* CLAUDE FIX: Moved the dynamic accent CSS variable from an inline `style`
          prop (which triggers lint warnings) into a <style> tag injected in the
          document head. This is the correct pattern for server-driven CSS variables
          that cannot live in a static external stylesheet. */}
      <head>
        <style>{`:root { --color-primary: ${siteConfig.accentColor}; }`}</style>
      </head>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} bg-background font-sans text-foreground antialiased`}
      >
        <AppProviders>{children}</AppProviders>
        <Toaster richColors position="bottom-right" closeButton />
        <Analytics />
      </body>
    </html>
  );
}
