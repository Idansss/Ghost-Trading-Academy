import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/signals/track-record"],
        disallow: [
          "/dashboard",
          "/journal",
          "/signals",
          "/outlook",
          "/analytics",
          "/education",
          "/calculator",
          "/community",
          "/notifications",
          "/profile",
          "/admin",
        ],
      },
    ],
    sitemap: "https://ghosttradingacademy.com/sitemap.xml",
  };
}
