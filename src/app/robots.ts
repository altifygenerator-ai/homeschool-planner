import type { MetadataRoute } from "next";

const baseUrl = "https://softweekplanner.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/beta"],
      disallow: ["/api/", "/dashboard/", "/guest", "/login", "/planner"],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
