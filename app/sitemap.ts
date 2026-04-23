import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://ghosttradingacademy.com/",
      changeFrequency: "hourly",
      priority: 1,
    },
    {
      url: "https://ghosttradingacademy.com/signals/track-record",
      changeFrequency: "daily",
      priority: 0.8,
    },
  ];
}
