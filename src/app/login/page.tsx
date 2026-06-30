import { Suspense } from "react";
import AuthPage from "@/components/auth/AuthPage";
import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";

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
