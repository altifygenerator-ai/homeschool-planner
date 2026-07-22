import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Planner",
  robots: { index: false, follow: false },
};

export default function DashboardLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
