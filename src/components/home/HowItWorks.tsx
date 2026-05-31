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
            title="Try the flow first. Help shape the full tool."
            text="SoftWeek is not trying to become a rigid curriculum system. The goal is a gentle weekly planner that lets parents plan, adjust, save, and look back without adding more stress."
          />

          <div className="btn-row" style={{ marginTop: "1.7rem" }}>
            <a className="btn btn-primary" href="/dashboard/planner">
              Open planner demo
            </a>
            <a className="btn btn-secondary" href="/beta">
              Give feedback
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