import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "SoftWeek Planner",
    short_name: "Softweek",
    description:
      "A simple homeschool weekly planner for planning, moving, saving, and printing real family records.",
    start_url: "/dashboard?source=pwa",
    scope: "/",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: "#fbf6ec",
    theme_color: "#fbf6ec",
    categories: ["education", "productivity", "utilities"],
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/maskable-icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/maskable-icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    screenshots: [
      {
        src: "/pwa-screenshot-wide.png",
        sizes: "1280x720",
        type: "image/png",
        form_factor: "wide",
        label: "SoftWeek Planner dashboard",
      },
      {
        src: "/pwa-screenshot-mobile.png",
        sizes: "540x960",
        type: "image/png",
        form_factor: "narrow",
        label: "Softweek mobile planner",
      },
    ],
  };
}
