import Link from "next/link";
import { LuArrowRight, LuMail, LuMessageSquareText } from "react-icons/lu";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

const testerEmail =
  "mailto:support@softweekplanner.com?subject=SoftWeek%20Feedback&body=Hey%2C%20I%20saw%20SoftWeek%20and%20I%27d%20be%20interested%20in%20testing%20it.%0A%0AA%20little%20about%20our%20homeschool%20setup%3A%0A%0AWhat%20feels%20hardest%20about%20planning%20right%20now%3A%0A";

const feedbackEmail =
  "mailto:support@softweekplanner.com?subject=SoftWeek%20Feedback&body=Hey%2C%20I%20tried%20SoftWeek%20and%20here%27s%20my%20feedback.%0A%0AWhat%20felt%20useful%3A%0A%0AWhat%20felt%20confusing%3A%0A%0AWhat%20I%20wish%20it%20could%20do%3A%0A%0AAnything%20that%20felt%20too%20rigid%20or%20too%20busy%3A%0A";

const feedbackPoints = [
  {
    title: "Try one normal week",
    text: "Set up one real course, choose its normal days, complete a lesson, and see whether the next-step flow feels easier than maintaining a calendar.",
  },
  {
    title: "Review the automatic record",
    text: "Complete, skip, or move real work, then check whether the record is useful without a separate save step.",
  },
  {
    title: "Tell me what feels off",
    text: "The best notes are plain ones: confusing, too hidden, too busy, missing, slow, or not how your family would use it.",
  },
];

export default function BetaPage() {
  return (
    <main className="site-shell">
      <Header />

      <section className="section">
        <div className="container">
          <div className="beta-hero-grid">
            <div>
              <p className="eyebrow">Feedback</p>

              <h1 className="section-title">
                I’m building SoftWeek and need honest homeschool feedback.
              </h1>

              <p className="section-lead">
                SoftWeek now centers on Courses, Today, a lighter weekly view, and automatic records.
                Load a curriculum sequence once, choose the normal days, and SoftWeek keeps the next
                lesson moving without dating the whole year. It is still beta, so I’m looking for the
                parts that genuinely save time and the parts that still get in the way.
              </p>

              <div className="btn-row beta-actions">
                <Link className="btn btn-primary" href="/login?mode=create">
                  Create beta account
                  <LuArrowRight />
                </Link>

                <Link className="btn btn-secondary" href={testerEmail}>
                  <LuMail />
                  Email me to test
                </Link>
              </div>

              <p className="hero-note">
                You can also use guest mode if you want to look around before making an account.
              </p>
            </div>

            <div className="form-card beta-feedback-card">
              <p className="eyebrow">What I’m looking for</p>
              <h2 className="section-title-sm">Plain feedback beats polite feedback.</h2>

              <p className="text-soft">
                Tell me where it feels clunky, fake, confusing, too pretty, too
                hidden, or not useful for a normal homeschool week.
              </p>

              <div className="beta-question-list">
                <p>Was setting up a course obvious?</p>
                <p>Does seeing only the next lesson reduce planning work?</p>
                <p>Does the automatic record reflect what really happened?</p>
                <p>Would you come back to Today during a normal school week?</p>
              </div>

              <Link className="btn btn-primary" href={feedbackEmail}>
                <LuMessageSquareText />
                Send feedback
              </Link>
            </div>
          </div>

          <div className="beta-card-grid human-beta-points">
            {feedbackPoints.map((item) => (
              <article className="feature-card human-feature-card" key={item.title}>
                <h3 className="feature-title">{item.title}</h3>
                <p className="feature-text">{item.text}</p>
              </article>
            ))}
          </div>

          <div className="soft-card beta-note-card human-beta-card">
            <div>
              <p className="eyebrow">Quick note</p>
              <h2 className="section-title-sm">
                The beta does not need to look perfect. It needs to work.
              </h2>
              <p className="section-lead">
                I’m keeping the planner focused on Today, Courses, a flexible weekly flow, automatic
                records, and simple family use. Feedback helps decide whether this lighter next-lesson
                approach is actually worth coming back to week after week.
              </p>
            </div>

            <div className="btn-row">
              <Link className="btn btn-primary" href="/guest">
                Try as guest
              </Link>

              <Link className="btn btn-secondary" href={feedbackEmail}>
                Send feedback
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
