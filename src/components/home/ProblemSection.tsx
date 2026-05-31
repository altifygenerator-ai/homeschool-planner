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
          eyebrow="What we’re testing"
          title="SoftWeek is being shaped around real homeschool weeks."
          text="The early version is live so homeschool families can test the flow before the full account system, database storage, and premium features are built."
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