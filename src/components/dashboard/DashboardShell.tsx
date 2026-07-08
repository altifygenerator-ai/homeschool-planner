import Link from "next/link";
import type { ReactNode } from "react";
import AccountBar from "@/components/auth/AccountBar";
import AuthGate from "@/components/auth/AuthGate";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import MobileDashboardNav from "@/components/pwa/MobileDashboardNav";

const dashboardLinks = [
  { label: "Home", href: "/dashboard" },
  { label: "Planner", href: "/dashboard/planner" },
  { label: "Saved Weeks", href: "/dashboard/weeks" },
  { label: "Children", href: "/dashboard/children" },
  { label: "Account", href: "/dashboard/account" },
];

type DashboardShellProps = {
  children: ReactNode;
};

export default function DashboardShell({ children }: DashboardShellProps) {
  return (
    <main className="site-shell">
      <Header />

      <section className="dashboard-section">
        <div className="container">
          <AuthGate>
            <div className="dashboard-topbar soft-card">
              <div>
                <p className="eyebrow">SoftWeek Planner</p>
                <h1>Family planner workspace</h1>
              </div>

              <nav className="dashboard-nav" aria-label="Dashboard navigation">
                {dashboardLinks.map((link) => (
                  <Link href={link.href} key={link.href}>
                    {link.label}
                  </Link>
                ))}
              </nav>

              <AccountBar />
            </div>

            {children}
          </AuthGate>
        </div>
      </section>

      <Footer />
      <MobileDashboardNav />
    </main>
  );
}
