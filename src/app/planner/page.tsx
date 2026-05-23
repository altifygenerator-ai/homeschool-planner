import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import PlannerShell from "@/components/planner/PlannerShell";

export default function PlannerPage() {
  return (
    <main className="site-shell">
      <Header />
      <PlannerShell />
      <Footer />
    </main>
  );
}