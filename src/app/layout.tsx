import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { Fraunces, Manrope } from "next/font/google";
import "./globals.css";

const heading = Fraunces({
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap",
});

const body = Manrope({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://softweekplanner.com"),
  title: {
    default: "SoftWeek Planner | Flexible Homeschool Planning",
    template: "%s | SoftWeek Planner",
  },
  description:
    "SoftWeek Planner is a softer homeschool planner for real-life weeks. Plan flexible activities, add one plan to multiple days, save weekly records, and keep simple child profiles.",
  keywords: [
    "homeschool planner",
    "homeschool planning app",
    "weekly homeschool planner",
    "flexible homeschool planner",
    "homeschool record keeping",
    "homeschool portfolio",
    "SoftWeek Planner",
  ],
  authors: [{ name: "SoftWeek Planner" }],
  creator: "SoftWeek Planner",
  openGraph: {
    title: "SoftWeek Planner | A Softer Homeschool Planner",
    description:
      "Plan real-life homeschool weeks with flexible activities, multi-day plans, saved week records, and simple child profiles.",
    url: "https://softweekplanner.com",
    siteName: "SoftWeek Planner",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "SoftWeek Planner | A Softer Homeschool Planner",
    description:
      "A flexible homeschool planner for real-life weeks, with multi-day plans, saved records, and simple child profiles.",
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