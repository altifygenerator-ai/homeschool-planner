import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { Lora, Manrope } from "next/font/google";
import "./globals.css";

const heading = Lora({
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap",
});

const body = Manrope({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

const siteUrl = "https://softweekplanner.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: "SoftWeek Planner",
  title: {
    default: "SoftWeek Planner | Flexible Homeschool Planning",
    template: "%s | SoftWeek Planner",
  },
  description:
    "SoftWeek Planner is a softer homeschool planner for real-life weeks. Create a free beta account, plan flexible 7-day weeks, move lessons when life changes, attach resource links, save weekly records, and keep simple child profiles.",

  keywords: [
    "homeschool planner",
    "homeschool planning app",
    "weekly homeschool planner",
    "flexible homeschool planner",
    "homeschool schedule planner",
    "homeschool record keeping",
    "homeschool planner for multiple kids",
    "student homeschool planner",
    "homeschool resource planner",
    "homeschool portfolio",
    "homeschool weekly records",
    "relaxed homeschool planner",
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
    title: "SoftWeek Planner | A Softer Homeschool Planner",
    description:
      "Plan real-life homeschool weeks with flexible activities, multi-day plans, child profiles, resource links, saved week records, and a calmer weekly flow.",
    url: siteUrl,
    siteName: "SoftWeek Planner",
    type: "website",
    locale: "en_US",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "SoftWeek Planner flexible homeschool planning app",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "SoftWeek Planner | A Softer Homeschool Planner",
    description:
      "A flexible homeschool planner for real-life weeks, with multi-day plans, resource links, saved records, child profiles, and a calm weekly planning flow.",
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
      <body className={`${heading.variable} ${body.variable}`}>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
