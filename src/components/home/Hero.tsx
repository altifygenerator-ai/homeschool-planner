import { LuArrowRight, LuCalendarDays, LuLeaf } from "react-icons/lu";
import { site } from "@/data/site";
import Button from "@/components/shared/Button";
import FadeIn from "@/components/shared/FadeIn";
import PlannerPreview from "@/components/home/PlannerPreview";

export default function Hero() {
  return (
    <section className="hero-section">
      <div className="container hero-grid">
        <FadeIn className="hero-copy">
          <p className="eyebrow">{site.hero.eyebrow}</p>

          <h1 className="hero-title">
            A homeschool planner that can <span>move with your week.</span>
          </h1>

          <p className="hero-text">{site.hero.text}</p>

          <div className="btn-row hero-actions">
            <Button href="/planner">
              {site.hero.primaryCta}
              <LuArrowRight />
            </Button>

            <Button href="/beta" variant="secondary">
              {site.hero.secondaryCta}
            </Button>
          </div>

          <p className="hero-note">
            <LuLeaf style={{ display: "inline", marginRight: "0.35rem" }} />
            {site.hero.note}
          </p>
        </FadeIn>

        <FadeIn delay={0.12}>
          <div id="planner-preview" className="planner-preview-card">
            <PlannerPreview />
          </div>

          <div className="pill-row" style={{ marginTop: "1rem" }}>
            <span className="pill pill-sage">
              <LuCalendarDays /> Moveable weekly plans
            </span>
            <span className="pill pill-gold">Done / moved / skipped</span>
            <span className="pill pill-clay">No rigid curriculum lock-in</span>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}