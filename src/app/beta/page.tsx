import Link from "next/link";
import {
  LuArrowRight,
  LuCircleCheck,
  LuMail,
  LuMessageSquareText,
  LuMousePointerClick,
} from "react-icons/lu";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

const testerEmail =
  "mailto:jlccustoms@gmail.com?subject=SoftWeek Planner%20Planner%20Feedback&body=Hey%2C%20I%20saw%20SoftWeek Planner%20and%20I%27d%20be%20interested%20in%20testing%20it.%0A%0AA%20little%20about%20our%20homeschool%20setup%3A%0A%0AWhat%20feels%20hardest%20about%20planning%20right%20now%3A%0A";

const feedbackEmail =
  "mailto:jlccustoms@gmail.com?subject=SoftWeek Planner%20Planner%20Feedback&body=Hey%2C%20I%20tried%20SoftWeek Planner%20and%20here%27s%20my%20feedback.%0A%0AWhat%20felt%20useful%3A%0A%0AWhat%20felt%20confusing%3A%0A%0AWhat%20I%20wish%20it%20could%20do%3A%0A%0AAnything%20that%20felt%20too%20rigid%20or%20too%20busy%3A%0A";

const feedbackPoints = [
  {
    icon: LuMousePointerClick,
    title: "Try the weekly planner",
    text: "Add a plan, choose one or several days, move cards around, mark things done or skipped, and see if the flow makes sense.",
  },
  {
    icon: LuCircleCheck,
    title: "Save a week",
    text: "Use the save-week button and check whether the child rundowns feel helpful or if they need to work differently.",
  },
  {
    icon: LuMessageSquareText,
    title: "Tell me what felt off",
    text: "The most helpful feedback is what felt confusing, cramped, too rigid, or missing for your actual homeschool week.",
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
                Tell me what would make SoftWeek Planner more useful.
              </h1>

              <p className="section-lead">
                SoftWeek Planner is usable now for weekly planning, multi-day activities, child profiles, saved weeks, and simple records. I’m still using real feedback to decide what needs to be clearer, calmer, or more useful next.
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
                Create a beta account, log back in on this device, or use guest mode if you want to try the planner first.
              </p>
            </div>

            <div className="form-card beta-feedback-card">
              <p className="eyebrow">What I’m looking for</p>
              <h2 className="section-title-sm">Tell me what actually helps and what doesn’t.</h2>

              <p className="text-soft">
                I’m looking for notes on whether the planner feels clear, calm, useful, and easy enough to come back to during a real homeschool week.
              </p>

              <div className="beta-question-list">
                <p>Does adding plans feel easy?</p>
                <p>Would multi-day plans save you time?</p>
                <p>Do saved weeks and child rundowns feel useful?</p>
                <p>What feels cramped, confusing, or unnecessary?</p>
              </div>

              <Link className="btn btn-primary" href={feedbackEmail}>
                <LuMessageSquareText />
                Send feedback
              </Link>
            </div>
          </div>

          <div className="beta-card-grid">
            {feedbackPoints.map((item) => {
              const Icon = item.icon;

              return (
                <article className="feature-card" key={item.title}>
                  <div className="feature-icon">
                    <Icon />
                  </div>

                  <h3 className="feature-title">{item.title}</h3>
                  <p className="feature-text">{item.text}</p>
                </article>
              );
            })}
          </div>

          <div className="soft-card beta-note-card">
            <div>
              <p className="eyebrow">Quick note</p>
              <h2 className="section-title-sm">
                Your feedback shapes the next version.
              </h2>
              <p className="section-lead">
                This early beta is meant for testing the weekly flow, family setup, saved records, and child logins. A fuller account release is planned next so families can keep safer records, access their planner more easily, and use stronger print and export tools.
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
