import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const siteUrl = "https://softweekplanner.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: "SoftWeek Planner",
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
      { url: "/icon.png", type: "image/png" },
    ],
    apple: [{ url: "/apple-icon.png", type: "image/png" }],
    shortcut: "/favicon.ico",
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>{children}<Analytics /></body>
    </html>
  );
}
