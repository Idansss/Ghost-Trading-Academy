import withPWA from "next-pwa";

/** @type {import('next').NextConfig} */
// AUDIT FIX: Chat images should only load from trusted remotes. The previous
// wildcard hostname allowed any remote image domain in Next/Image.
const uploadthingDomain = (
  process.env.NEXT_PUBLIC_UPLOADTHING_CDN_DOMAIN ??
  process.env.UPLOADTHING_CDN_DOMAIN ??
  ""
)
  .replace(/^https?:\/\//, "")
  .replace(/\/$/, "");

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
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "utfs.io",
      },
      {
        protocol: "https",
        hostname: "**.ufs.sh",
      },
      ...(uploadthingDomain
        ? [
            {
              protocol: "https",
              hostname: uploadthingDomain,
            },
          ]
        : []),
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

export default withPWA({
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
