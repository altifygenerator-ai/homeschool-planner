import type { MetadataRoute } from "next";

const baseUrl = "https://softweekplanner.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: baseUrl, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${baseUrl}/beta`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
  ];
}
