import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import BetaFeedbackWidget from "@/components/shared/BetaFeedbackWidget";
import ServiceWorkerRegister from "@/components/pwa/ServiceWorkerRegister";
import "./globals.css";

const siteUrl = "https://softweekplanner.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: "Softweek",
  manifest: "/manifest.webmanifest",
  title: {
    default: "SoftWeek Planner | Simple Homeschool Weekly Planning",
    template: "%s | SoftWeek Planner",
  },
  description:
    "SoftWeek Planner is a simple homeschool weekly planner in beta. Plan a real week, move what changes, attach resource links, save weekly records, and print records for your binder.",

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
    title: "Softweek",
    statusBarStyle: "default",
  },

  openGraph: {
    title: "SoftWeek Planner | Simple Homeschool Weekly Planning",
    description:
      "A beta homeschool planner for planning the week, moving what changes, saving records, and printing binder-friendly records.",
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
      "Plan the week, move what changes, save the record, and print records for your homeschool binder.",
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
  themeColor: "#fbf6ec",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>{children}<BetaFeedbackWidget /><ServiceWorkerRegister /><Analytics /></body>
    </html>
  );
}
