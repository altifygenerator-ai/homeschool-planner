import { LuArrowRight, LuHeartHandshake } from "react-icons/lu";
import Button from "@/components/shared/Button";
import FadeIn from "@/components/shared/FadeIn";

export default function BetaCTA() {
  return (
    <section className="section">
      <div className="container">
        <FadeIn>
          <div
            className="soft-card beta-cta-card"
            style={{
              padding: "clamp(1.5rem, 5vw, 3.5rem)",
              display: "grid",
              gridTemplateColumns: "1fr auto",
              gap: "2rem",
              alignItems: "center",
            }}
          >
            <div>
              <p className="eyebrow">Built with real families</p>
              <h2 className="section-title-sm">
                I’m testing this before turning it into a full app.
              </h2>
              <p className="section-lead">
                The goal is to build a planner that helps homeschool parents
                feel less behind, not one that adds more boxes to fill out.
                Early testers can help shape the weekly planning flow before it
                gets bigger.
              </p>
            </div>

            <div className="stack-sm">
              <div className="feature-icon" style={{ marginLeft: "auto" }}>
                <LuHeartHandshake />
              </div>

              <div className="btn-row">
                <Button href="/beta">
                  Join the beta list
                  <LuArrowRight />
                </Button>
              </div>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}