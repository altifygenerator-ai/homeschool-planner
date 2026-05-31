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
              <p className="eyebrow">Help test the early version</p>
              <h2 className="section-title-sm">
                Try it like a real homeschool week, then tell me what feels off.
              </h2>
              <p className="section-lead">
                The biggest help right now is honest feedback on the planner
                flow: adding plans, choosing multiple days, moving cards,
                saving weeks, and whether the child records idea actually feels
                useful.
              </p>
            </div>

            <div className="beta-cta-panel">
              <div className="feature-icon">
                <LuHeartHandshake />
              </div>

              <p>
                This early version uses local browser storage while the flow is
                being tested.
              </p>

              <div className="btn-row">
                <Button href="/dashboard/planner">
                  Try planner
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
              <h3>Full accounts and database storage come later.</h3>
              <p>
                The final SaaS version should have real user accounts,
                database-backed saved weeks, child profiles, backups, and a
                genuinely useful free plan. Right now, the focus is testing the
                planner flow before building the heavier backend.
              </p>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}