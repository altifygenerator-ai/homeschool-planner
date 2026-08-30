import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "SoftWeek Planner",
    short_name: "SoftWeek",
    description:
      "A homeschool curriculum-flow planner that keeps the next lesson moving and turns completed work into records automatically.",
    start_url: "/dashboard/planner?view=today&source=pwa",
    scope: "/",
    display: "standalone",
    background_color: "#f7f1e5",
    theme_color: "#2f4a3c",
    categories: ["education", "productivity", "utilities"],
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/maskable-icon-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/maskable-icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    screenshots: [
      {
        src: "/pwa-screenshot-wide.png",
        sizes: "1280x651",
        type: "image/png",
        form_factor: "wide",
        label: "SoftWeek homeschool planner week view",
      },
      {
        src: "/pwa-screenshot-mobile.png",
        sizes: "540x901",
        type: "image/png",
        form_factor: "narrow",
        label: "SoftWeek Today view on mobile",
      },
    ],
  };
}
