import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Hero from "@/components/home/Hero";
import ProblemSection from "@/components/home/ProblemSection";
import HowItWorks from "@/components/home/HowItWorks";
import BetaCTA from "@/components/home/BetaCTA";

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