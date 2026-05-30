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
              <p className="eyebrow">Built with real feedback</p>
              <h2 className="section-title-sm">
                We’re testing the flow before building the full account system.
              </h2>
              <p className="section-lead">
                SoftWeek is still early. The planner works with local browser
                storage right now so families can click around, test the flow,
                and help shape what should come next before we add accounts,
                synced storage, and bigger features.
              </p>
            </div>

            <div className="stack-sm">
              <div className="feature-icon" style={{ marginLeft: "auto" }}>
                <LuHeartHandshake />
              </div>

              <div className="btn-row">
                <Button href="/beta">
                  Join the tester list
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