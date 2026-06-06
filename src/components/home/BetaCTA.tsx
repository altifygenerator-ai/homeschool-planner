import { LuArrowRight, LuDatabase, LuHeartHandshake } from "react-icons/lu";
import Button from "@/components/shared/Button";
import FadeIn from "@/components/shared/FadeIn";

export default function BetaCTA() {
  return (
    <section className="section" id="what-to-test">
      <div className="container">
        <FadeIn>
          <div className="soft-card beta-cta-card">
            <div>
              <p className="eyebrow">Use it and shape what comes next</p>
              <h2 className="section-title-sm">
                Try it for a real homeschool week, then tell me what would make it better.
              </h2>
              <p className="section-lead">
                SoftWeek Planner is usable now for children, weekly plans, multi-day activities, saved weeks, and child records. Feedback still matters because the goal is to build the parts homeschool families will actually use.
              </p>
            </div>

            <div className="beta-cta-panel">
              <div className="feature-icon">
                <LuHeartHandshake />
              </div>

              <p>
                Your planner saves in this browser right now, so you can use it
                without creating an account.
              </p>

              <div className="btn-row">
                <Button href="/dashboard/planner">
                  Open planner
                  <LuArrowRight />
                </Button>

                <Button href="/beta" variant="secondary">
                  Send feedback
                </Button>
              </div>
            </div>
          </div>
        </FadeIn>

        <FadeIn delay={0.12}>
          <div className="soft-card beta-storage-note">
            <div className="feature-icon">
              <LuDatabase />
            </div>

            <div>
              <h3>Accounts and backed-up storage are the next foundation.</h3>
              <p>
                The local version helps test the weekly flow first. The account-backed version should keep saved weeks, children, plans, and records in a real database with backups.
              </p>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}