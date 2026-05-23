import { LuCalendarX, LuMoveRight, LuNotebookPen } from "react-icons/lu";
import { site } from "@/data/site";
import SectionHeading from "@/components/shared/SectionHeading";
import FadeIn from "@/components/shared/FadeIn";

const icons = [LuCalendarX, LuMoveRight, LuNotebookPen];

export default function ProblemSection() {
  return (
    <section className="section-paper">
      <div className="container">
        <SectionHeading
          eyebrow="The actual problem"
          title="Most planners act like homeschool weeks never change."
          text="But real homeschool days are flexible. Some learning is planned, some happens naturally, and some things need to move. SoftWeek is built around that reality."
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