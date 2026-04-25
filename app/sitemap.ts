import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://thethesisdesk.xyz/",
      changeFrequency: "hourly",
      priority: 1,
    },
    {
      url: "https://thethesisdesk.xyz/signals/track-record",
      changeFrequency: "daily",
      priority: 0.8,
    },
  ];
}
