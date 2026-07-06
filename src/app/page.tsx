import Link from "next/link";
import { LuArrowRight, LuLock, LuMousePointerClick, LuUserPlus } from "react-icons/lu";
import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import { site } from "@/data/site";

const plannerNow = [
  "Plan a full 7-day homeschool week",
  "Add one plan to multiple days",
  "Move or copy a plan without rebuilding the week",
  "Attach links for videos, PDFs, worksheets, websites, or classes",
  "Save weekly records with notes and child rundowns",
  "Print weekly, monthly, or yearly records for a binder",
];

const notTryingToBe = [
  "a full school management system",
  "a complicated gradebook setup",
  "a perfect schedule that makes you feel behind",
  "another place that takes longer to manage than paper",
];

const freePlanFeatures = [
  "A weekly planner that stays useful",
  "One child profile for basic planning",
  "Move, done, skipped, notes, categories, and saved history",
];

const premiumPlanFeatures = [
  "Multiple children and optional older-kid logins",
  "Longer saved history, child portfolios, printables, and exports",
  "Planning-ahead tools, templates, and backed-up accounts",
];

const testimonials = [
  {
    quote:
      "SoftWeek Planner was one app that finally did not overwhelm me. My older kids could use it themselves with minimal help.",
    name: "Miss Elise’s Art House",
  },
  {
    quote:
      "It feels built for the real homeschool week, not the perfect one. Families can plan loosely, move what changes, and save what happened.",
    name: "Untethered — Learning, Without Limits",
  },
];

export default function Home() {
  return (
    <main className="site-shell">
      <Header />

      <section className="home-hero-section">
        <div className="container home-hero-grid">
          <div className="home-hero-copy">
            <p className="eyebrow">{site.hero.eyebrow}</p>
            <h1 className="hero-title">{site.hero.title}</h1>
            <p className="hero-text">{site.hero.text}</p>

            <div className="btn-row hero-actions">
              <Link className="btn btn-primary" href="/login?mode=create">
                <LuUserPlus />
                {site.hero.primaryCta}
              </Link>
              <Link className="btn btn-secondary" href="/guest">
                <LuMousePointerClick />
                {site.hero.secondaryCta}
              </Link>
            </div>

            <p className="hero-note">{site.hero.note}</p>
          </div>

          <div className="home-product-card soft-card human-note-card">
            <p className="eyebrow">Why I’m building it</p>
            <h2>A normal homeschool week rarely stays perfectly planned.</h2>
            <p>
              SoftWeek is being built around that normal mess: moved lessons,
              repeating activities, resource links, older kids checking their own
              work, and records you can actually keep up with.
            </p>
            <div className="product-loop-list">
              <div>
                <span>1</span>
                <p>Plan the week loosely.</p>
              </div>
              <div>
                <span>2</span>
                <p>Move what changes.</p>
              </div>
              <div>
                <span>3</span>
                <p>Save what happened.</p>
              </div>
              <div>
                <span>4</span>
                <p>Print or review records later.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section-paper" id="app-preview">
        <div className="container">
          <div className="section-center">
            <p className="eyebrow">What works now</p>
            <h2 className="section-title">The beta is usable now, not just a landing page.</h2>
            <p className="section-lead">
              The goal is not to look like a perfect startup product. The goal is
              to give families a weekly workspace that saves time and keeps a
              simple record when the week is done.
            </p>
          </div>

          <div className="plain-feature-list">
            {plannerNow.map((feature) => (
              <article className="plain-feature-card" key={feature}>
                <span />
                <p>{feature}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section" id="pain-points">
        <div className="container human-section-grid">
          <div>
            <p className="eyebrow">What it helps with</p>
            <h2 className="section-title">Built for the week you actually have.</h2>
            <p className="section-lead">
              Some homeschool weeks are heavy on book work. Some are errands,
              appointments, reading, projects, co-op, outside time, and catching
              up later. SoftWeek is meant to bend without making the whole plan
              feel broken.
            </p>
          </div>

          <div className="feature-grid human-feature-grid">
            {site.problems.map((item) => (
              <article className="feature-card human-feature-card" key={item.title}>
                <h3 className="feature-title">{item.title}</h3>
                <p className="feature-text">{item.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section-soft" id="how-it-works">
        <div className="container section-grid">
          <div>
            <p className="eyebrow">How it works</p>
            <h2 className="section-title">A simple loop: plan, adjust, save.</h2>
            <p className="section-lead">
              Start with a guest planner or create a beta account. Add children,
              build the week, move what changes, and save a record when you are
              ready. That is the core of it.
            </p>
            <div className="btn-row" style={{ marginTop: "1.7rem" }}>
              <Link className="btn btn-primary" href="/login?mode=create">
                Create account
              </Link>
              <Link className="btn btn-secondary" href="/login?mode=login">
                Log in
              </Link>
            </div>
          </div>

          <div className="stack-md home-step-list">
            {site.steps.map((step, index) => (
              <article className="paper-card home-step-card" key={step.title}>
                <span>{index + 1}</span>
                <div>
                  <h3>{step.title}</h3>
                  <p>{step.text}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section" id="not-a-fit">
        <div className="container honest-grid">
          <div className="soft-card honest-card">
            <p className="eyebrow">What it is not</p>
            <h2 className="section-title-sm">SoftWeek is intentionally smaller.</h2>
            <p className="text-soft">
              I’m not trying to build a giant school platform. I’m trying to keep
              the weekly planning part clear enough that families can come back
              to it without dreading the setup.
            </p>
          </div>

          <div className="paper-card honest-list-card">
            {notTryingToBe.map((item) => (
              <p key={item}>{item}</p>
            ))}
          </div>
        </div>
      </section>

      <section className="section-soft" id="testimonials">
        <div className="container">
          <div className="section-center">
            <p className="eyebrow">Early feedback</p>
            <h2 className="section-title">Notes from early testers.</h2>
            <p className="section-lead">
              I’m keeping this section plain on purpose. The useful part is what
              testers noticed, not a polished quote wall.
            </p>
          </div>

          <div className="home-testimonial-grid human-testimonial-grid">
            {testimonials.map((testimonial) => (
              <figure className="paper-card testimonial-card human-testimonial-card" key={testimonial.name}>
                <blockquote>“{testimonial.quote}”</blockquote>
                <figcaption>{testimonial.name}</figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      <section className="section" id="beta-direction">
        <div className="container">
          <div className="soft-card beta-release-card human-beta-card">
            <div>
              <p className="eyebrow">Beta notes</p>
              <h2 className="section-title-sm">Free to test while the planner gets tightened up.</h2>
              <p className="section-lead">
                The main weekly planner should stay useful for free. Bigger tools
                like more saved history, portfolios, exports, child accounts, and
                planning-ahead features may become premium later, but they are
                open during beta while I learn what families actually use.
              </p>
            </div>
            <div className="beta-release-panel">
              <LuLock />
              <p>
                Beta feedback matters more than looking finished. Try it, break
                it, and send over what feels confusing or unnecessary.
              </p>
              <Link className="btn btn-primary" href="/login?mode=create">
                Start beta account <LuArrowRight />
              </Link>
            </div>
          </div>

          <div className="marketing-plan-grid human-plan-grid">
            <article className="plan-feature-card free-feature-card">
              <div className="plan-feature-top">
                <div>
                  <span>Main planner stays useful</span>
                  <h3>Free foundation</h3>
                </div>
              </div>

              <p>
                SoftWeek should help a family plan a real week without forcing
                every parent into a paid plan.
              </p>

              <ul>
                {freePlanFeatures.map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>
            </article>

            <article className="plan-feature-card premium-feature-card">
              <div className="plan-feature-top">
                <div>
                  <span>Open during beta</span>
                  <h3>Bigger tools later</h3>
                </div>
              </div>

              <p>
                These are the deeper tools I’m testing before deciding what
                belongs in a future premium version.
              </p>

              <ul>
                {premiumPlanFeatures.map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>
            </article>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
