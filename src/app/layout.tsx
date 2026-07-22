import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import BetaFeedbackWidget from "@/components/shared/BetaFeedbackWidget";
import ServiceWorkerRegister from "@/components/pwa/ServiceWorkerRegister";
import "./globals.css";

const siteUrl = "https://softweekplanner.com";

const localWorkerCleanupScript = `(() => {
  try {
    const localHosts = new Set(["localhost", "127.0.0.1", "::1"]);
    const isLocal = localHosts.has(window.location.hostname);
    const migrationKey = "softweek-service-worker-reset-v6";
    const controlled = Boolean(navigator.serviceWorker && navigator.serviceWorker.controller);

    let migrated = false;
    try { migrated = localStorage.getItem(migrationKey) === "done"; } catch {}

    // New production installs have nothing stale to clear. Mark the migration
    // complete before the current worker is registered later in the page load.
    if (!isLocal && !controlled) {
      try { localStorage.setItem(migrationKey, "done"); } catch {}
      return;
    }

    if (!isLocal && migrated) return;

    const needsReload = controlled;
    if (needsReload) document.documentElement.style.visibility = "hidden";

    const workerCleanup = "serviceWorker" in navigator
      ? navigator.serviceWorker.getRegistrations()
          .then((registrations) => Promise.allSettled(registrations.map((registration) => registration.unregister())))
          .catch(() => [])
      : Promise.resolve([]);

    const cacheCleanup = "caches" in window
      ? caches.keys()
          .then((keys) => Promise.allSettled(keys.filter((key) => key.startsWith("softweek-")).map((key) => caches.delete(key))))
          .catch(() => [])
      : Promise.resolve([]);

    Promise.allSettled([workerCleanup, cacheCleanup]).finally(() => {
      if (!isLocal) {
        try { localStorage.setItem(migrationKey, "done"); } catch {}
      }
      if (needsReload) {
        window.location.replace(window.location.href);
        return;
      }
      document.documentElement.style.visibility = "";
    });
  } catch {
    document.documentElement.style.visibility = "";
  }
})();`;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: "SoftWeek",
  manifest: "/manifest.webmanifest",
  title: {
    default: "SoftWeek Planner | Simple Homeschool Weekly Planning",
    template: "%s | SoftWeek Planner",
  },
  description:
    "Plan the homeschool week lightly, recover when life changes it, and keep the record automatically.",

  keywords: [
    "homeschool planner",
    "homeschool weekly planner",
    "weekly homeschool planner",
    "homeschool planning app",
    "flexible homeschool planner",
    "homeschool record keeping",
    "homeschool planner for multiple kids",
    "homeschool resource planner",
    "homeschool weekly records",
    "SoftWeek Planner",
  ],

  authors: [{ name: "SoftWeek Planner" }],
  creator: "SoftWeek Planner",
  publisher: "SoftWeek Planner",

  verification: {
    google: "0mLpkqixBfgJeNzzMQ9N_WWnKWxiAcm2Sa1MRief_Wk",
  },

  alternates: {
    canonical: siteUrl,
  },

  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/icon-192.png", type: "image/png", sizes: "192x192" },
      { url: "/icon-512.png", type: "image/png", sizes: "512x512" },
    ],
    apple: [{ url: "/apple-icon.png", type: "image/png", sizes: "180x180" }],
    shortcut: "/favicon.ico",
  },

  appleWebApp: {
    capable: true,
    title: "SoftWeek",
    statusBarStyle: "default",
  },

  openGraph: {
    title: "SoftWeek Planner | Simple Homeschool Weekly Planning",
    description:
      "Plan the week lightly, recover when life changes it, and keep the record automatically.",
    url: siteUrl,
    siteName: "SoftWeek Planner",
    type: "website",
    locale: "en_US",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "SoftWeek Planner weekly homeschool planning app",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "SoftWeek Planner | Simple Homeschool Weekly Planning",
    description:
      "Plan lightly, recover quickly, and keep homeschool records automatically.",
    images: ["/og-image.png"],
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: "#f4f0e7",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <head>
        <script dangerouslySetInnerHTML={{ __html: localWorkerCleanupScript }} />
      </head>
      <body>
        {children}
        <BetaFeedbackWidget />
        <ServiceWorkerRegister />
        <Analytics />
      </body>
    </html>
  );
}
