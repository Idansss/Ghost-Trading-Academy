import withPWA from "next-pwa";
import { withSentryConfig } from "@sentry/nextjs";

/** @type {import('next').NextConfig} */
// AUDIT FIX: Chat images should only load from trusted remotes. The previous
// wildcard hostname allowed any remote image domain in Next/Image.
// CLAUDE FIX: removed uploadthingDomain variable — UploadThing fully replaced by Supabase Storage.

function supabaseImageHost() {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!raw) return null;
  try {
    return new URL(raw).hostname;
  } catch {
    return null;
  }
}

const supabaseHost = supabaseImageHost();

const nextConfig = {
  // CLAUDE IMPROVEMENT: Ensure lightweight-charts ESM package is transpiled correctly
  // by the Next.js bundler so it works in both SSR and client contexts.
  transpilePackages: ["lightweight-charts"],
  images: {
    remotePatterns: [
      // CLAUDE FIX: kept utfs.io and ufs.sh for backward compat — existing DB records
      // may still point to these legacy CDN domains. New uploads go to Supabase Storage.
      {
        protocol: "https",
        hostname: "utfs.io",
      },
      {
        protocol: "https",
        hostname: "**.ufs.sh",
      },
      ...(supabaseHost
        ? [
            {
              protocol: "https",
              hostname: supabaseHost,
            },
          ]
        : []),
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=()" },
          {
            key: "Content-Security-Policy",
            value:
              "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https:; style-src 'self' 'unsafe-inline' https:; img-src 'self' data: https:; font-src 'self' data: https:; connect-src 'self' https: wss:; frame-ancestors 'none';",
          },
        ],
      },
    ];
  },
};

const pwaConfig = withPWA({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  runtimeCaching: [
    {
      urlPattern: /^https?.*\/api\/.*$/i,
      handler: "NetworkFirst",
      options: {
        cacheName: "api-cache",
        expiration: {
          maxEntries: 10,
          maxAgeSeconds: 60 * 60,
        },
      },
    },
  ],
})(nextConfig);

export default withSentryConfig(pwaConfig, {
  // Suppress the Sentry CLI upload banner in CI output
  silent: true,
  // Tunnels Sentry requests through /monitoring so ad-blockers don't drop them
  tunnelRoute: "/monitoring",
  // Source map upload — requires SENTRY_AUTH_TOKEN in CI env
  hideSourceMaps: true,
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  webpack: {
    // Tree-shake Sentry debug logging from production bundles
    treeshake: { removeDebugLogging: true },
    // Automatically instrument Next.js API routes and pages
    autoInstrumentServerFunctions: true,
  },
});
