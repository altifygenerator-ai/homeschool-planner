import { LuCalendarX, LuCopyPlus, LuNotebookPen } from "react-icons/lu";
import { site } from "@/data/site";
import SectionHeading from "@/components/shared/SectionHeading";
import FadeIn from "@/components/shared/FadeIn";

const icons = [LuCalendarX, LuCopyPlus, LuNotebookPen];

export default function ProblemSection() {
  return (
    <section className="section-paper">
      <div className="container">
        <SectionHeading
          eyebrow="Why it exists"
          title="SoftWeek Planner is built for the parts normal planners make harder."
          text="The goal is simple: less re-typing, less guilt when the week changes, and easier records without turning homeschool into another admin job."
          center
        />

        <div className="feature-grid">
          {site.problems.map((problem, index) => {
            const Icon = icons[index];

            return (
              <FadeIn key={problem.title} delay={index * 0.08}>
                <article className="feature-card">
                  <div className="feature-icon">
                    <Icon />
                  </div>

                  <h3 className="feature-title">{problem.title}</h3>
                  <p className="feature-text">{problem.text}</p>
                </article>
              </FadeIn>
            );
          })}
        </div>
      </div>
    </section>
  );
}