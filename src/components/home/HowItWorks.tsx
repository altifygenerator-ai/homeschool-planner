import { LuArchive, LuBookCheck, LuCirclePlus, LuMoveRight } from "react-icons/lu";
import { site } from "@/data/site";
import SectionHeading from "@/components/shared/SectionHeading";
import FadeIn from "@/components/shared/FadeIn";

const icons = [LuCirclePlus, LuMoveRight, LuArchive];

export default function HowItWorks() {
  return (
    <section className="section-soft" id="how-it-works">
      <div className="container section-grid">
        <FadeIn>
          <SectionHeading
            eyebrow="How it works"
            title="A flexible weekly board first. Full accounts later."
            text="The current version is meant to test the planning flow before adding Supabase accounts and permanent storage. For now, plans and saved weeks stay in your browser."
          />

          <div className="btn-row" style={{ marginTop: "1.7rem" }}>
            <a className="btn btn-primary" href="/dashboard/planner">
              Open early planner
            </a>
            <a className="btn btn-secondary" href="/beta">
              Help test it
            </a>
          </div>
        </FadeIn>

        <div className="stack-md">
          {site.steps.map((step, index) => {
            const Icon = icons[index] ?? LuBookCheck;

            return (
              <FadeIn key={step.title} delay={index * 0.08}>
                <article className="paper-card" style={{ padding: "1.25rem" }}>
                  <div
                    style={{
                      display: "flex",
                      gap: "1rem",
                      alignItems: "flex-start",
                    }}
                  >
                    <div className="feature-icon" style={{ marginBottom: 0 }}>
                      <Icon />
                    </div>

                    <div>
                      <p className="activity-title">{step.title}</p>
                      <p className="activity-meta">{step.text}</p>
                    </div>
                  </div>
                </article>
              </FadeIn>
            );
          })}
        </div>
      </div>
    </section>
  );
}