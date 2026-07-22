import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import AccountBar from "@/components/auth/AccountBar";
import AuthGate from "@/components/auth/AuthGate";
import MobileDashboardNav from "@/components/pwa/MobileDashboardNav";
import DesktopDashboardNav from "@/components/dashboard/DesktopDashboardNav";

export default function DashboardShell({ children }: { children: ReactNode }) {
  return (
    <main className="sw-app-shell">
      <AuthGate>
        <header className="sw-app-header">
          <Link className="sw-app-brand" href="/dashboard/planner?view=today" aria-label="SoftWeek Today">
            <span className="sw-brand-mark">SW</span>
            <span><strong>SoftWeek</strong><small>Homeschool planner</small></span>
          </Link>
          <Suspense fallback={<div className="sw-desktop-nav-placeholder" aria-hidden="true" />}>
            <DesktopDashboardNav />
          </Suspense>
          <div className="sw-account-area"><AccountBar /></div>
        </header>
        <div className="sw-app-content">{children}</div>
        <Suspense fallback={null}><MobileDashboardNav /></Suspense>
      </AuthGate>
    </main>
  );
}
