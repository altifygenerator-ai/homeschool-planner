import BetaCTA from "@/components/home/BetaCTA";
import Hero from "@/components/home/Hero";
import HowItWorks from "@/components/home/HowItWorks";
import PlannerPreview from "@/components/home/PlannerPreview";
import ProblemSection from "@/components/home/ProblemSection";
import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";

export default function Home() {
  return (
    <main className="site-shell">
      <Header />
      <Hero />
      <ProblemSection />
      <HowItWorks />
      <BetaCTA />
      <Footer />
    </main>
  );
}