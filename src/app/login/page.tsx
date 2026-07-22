import type { Metadata } from "next";
import { Suspense } from "react";
import AuthPage from "@/components/auth/AuthPage";
import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";

export const metadata: Metadata = {
  title: "Log in or create an account",
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return (
    <main className="site-shell">
      <Header />
      <Suspense fallback={null}>
        <AuthPage />
      </Suspense>
      <Footer />
    </main>
  );
}
