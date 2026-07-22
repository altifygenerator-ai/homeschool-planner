import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Guest Planner",
  robots: { index: false, follow: false },
};

export default function GuestLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
