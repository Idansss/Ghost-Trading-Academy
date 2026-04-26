import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
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

/** So relative OG/social image URLs work on Vercel when NEXT_PUBLIC_APP_URL is not set. */
function resolveMetadataBase(): URL | undefined {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    try {
      return new URL(process.env.NEXT_PUBLIC_APP_URL);
    } catch {
      return undefined;
    }
  }
  if (process.env.VERCEL_URL) {
    return new URL(`https://${process.env.VERCEL_URL}`);
  }
  return undefined;
}

function resolveSocialImageUrl(faviconUrl: string, metadataBase: URL | undefined): string {
  if (faviconUrl.startsWith("http://") || faviconUrl.startsWith("https://")) {
    return faviconUrl;
  }
  if (metadataBase) {
    return new URL(faviconUrl, metadataBase).toString();
  }
  return faviconUrl;
}

// CLAUDE IMPROVEMENT: Added complete Open Graph + Twitter card meta tags so
// shares on social media render a proper preview instead of a blank card.
// Tab + Apple touch icons use `app/icon.png` and `app/apple-icon.png` (Next.js metadata files).
export async function generateMetadata(): Promise<Metadata> {
  const siteConfig = await getSiteConfig();
  const platformName = siteConfig.platformName || DEFAULT_PLATFORM_NAME;
  const description =
    "Professional trading signals, journal, education, and analytics for serious crypto traders.";
  const faviconUrl = siteConfig.faviconUrl || "/brand/logo.png";
  const metadataBase = resolveMetadataBase();
  const socialImage = resolveSocialImageUrl(faviconUrl, metadataBase);

  return {
    title: { default: platformName, template: `%s | ${platformName}` },
    description,
    manifest: "/manifest.json",
    metadataBase,
    openGraph: {
      type: "website",
      siteName: platformName,
      title: platformName,
      description,
      images: [{ url: socialImage, width: 512, height: 512, alt: platformName }],
    },
    twitter: {
      card: "summary",
      title: platformName,
      description,
      images: [socialImage],
    },
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
        <SpeedInsights />
      </body>
    </html>
  );
}
