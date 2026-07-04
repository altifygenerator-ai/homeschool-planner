import Link from "next/link";
import {
  LuArrowRight,
  LuCircleCheck,
  LuCrown,
  LuHeartHandshake,
  LuLink,
  LuLock,
  LuMousePointerClick,
  LuMoveRight,
  LuSave,
  LuUserCheck,
  LuUserPlus,
} from "react-icons/lu";
import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import { site } from "@/data/site";

const freePlanFeatures = [
  "A simple weekly planner that stays useful",
  "One child profile for basic family planning",
  "Move, done, skipped, notes, categories, and short saved history",
];

const premiumPlanFeatures = [
  "Multiple children and optional older-kid logins",
  "Longer saved history, child portfolios, printables, and exports",
  "Cross-device accounts, month glance, and planning-ahead tools",
];

const previewFeatures = [
  {
    icon: LuMoveRight,
    title: "Move one plan",
    text: "Shift one subject to another day without rebuilding the whole week.",
  },
  {
    icon: LuCircleCheck,
    title: "Pick several days",
    text: "Add reading, practice, chores, outings, or projects to more than one day at once.",
  },
  {
    icon: LuLink,
    title: "Attach a link",
    text: "Keep a video, class link, worksheet, PDF, or website right on the plan card.",
  },
  {
    icon: LuUserCheck,
    title: "Older-kid view",
    text: "Kids can check their own plans, mark work done, and add notes with parent controls protected.",
  },
  {
    icon: LuSave,
    title: "Save the record",
    text: "Save what actually happened so weekly records can build into month and year history.",
  },
];

const testimonials = [
  {
    quote:
      "SoftWeek Planner was one app that finally did not overwhelm me. My older kids could use it themselves with minimal help. I really enjoyed the simplicity. It felt nice and rewarding to use.",
    name: "Miss Elise’s Art House",
  },
  {
    quote:
      "SoftWeek feels like it is being built for the real homeschool week, not the perfect one. It gives families room to plan loosely, move what changes, and save what actually happened.",
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

          <div className="home-product-card soft-card">
            <p className="eyebrow">Built around the real loop</p>
            <h2>Plan, adjust, save, repeat.</h2>
            <div className="product-loop-list">
              <div>
                <span>1</span>
                <p>Add children and a loose weekly plan.</p>
              </div>
              <div>
                <span>2</span>
                <p>Move cards when real life changes the week.</p>
              </div>
              <div>
                <span>3</span>
                <p>Mark what happened and add quick notes.</p>
              </div>
              <div>
                <span>4</span>
                <p>Save the week into a simple family record.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section-paper" id="app-preview">
        <div className="container">
          <div className="section-center">
            <p className="eyebrow">What it does now</p>
            <h2 className="section-title">A real planner families can use this week.</h2>
            <p className="section-lead">
              SoftWeek is live in beta with accounts, child profiles, 7-day planning,
              movable cards, resource links, saved weeks, and optional older-kid access.
              It is made to stay simple while still giving families a useful record.
            </p>
          </div>

          <div className="home-preview-feature-grid">
            {previewFeatures.map((feature) => {
              const Icon = feature.icon;

              return (
                <article className="paper-card home-preview-feature" key={feature.title}>
                  <Icon />
                  <h3>{feature.title}</h3>
                  <p>{feature.text}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="section" id="pain-points">
        <div className="container">
          <div className="section-center">
            <p className="eyebrow">What it helps with</p>
            <h2 className="section-title">
              Built for the parts current planners often make harder.
            </h2>
            <p className="section-lead">
              SoftWeek is not trying to be a heavy school admin system. It is
              being shaped around flexible homeschool weeks, simple records, and
              less guilt when the plan changes.
            </p>
          </div>

          <div className="feature-grid">
            {site.problems.map((item) => (
              <article className="feature-card" key={item.title}>
                <div className="feature-icon">
                  <LuCircleCheck />
                </div>
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
            <h2 className="section-title">A calmer weekly workspace for real homeschool life.</h2>
            <p className="section-lead">
              Create a family workspace, try the planner as a guest, add your
              children, build a flexible 7-day week, and save what happened when
              the week is done. This beta is meant to feel useful now while the
              full release keeps getting shaped by real homeschool feedback.
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

          <div className="stack-md">
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

      <section className="section-soft" id="testimonials">
        <div className="container">
          <div className="section-center">
            <p className="eyebrow">Early feedback</p>
            <h2 className="section-title">Simple enough to come back to.</h2>
            <p className="section-lead">
              SoftWeek is being shaped by homeschool families who want light structure,
              calmer planning, and records that do not turn into another full-time job.
            </p>
          </div>

          <div className="home-testimonial-grid">
            {testimonials.map((testimonial) => (
              <figure className="paper-card testimonial-card" key={testimonial.name}>
                <blockquote>“{testimonial.quote}”</blockquote>
                <figcaption>— {testimonial.name}</figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      <section className="section" id="beta-direction">
        <div className="container">
          <div className="soft-card beta-release-card">
            <div>
              <p className="eyebrow">Beta release direction</p>
              <h2 className="section-title-sm">The full release is being built around useful records, not extra busywork.</h2>
              <p className="section-lead">
                The goal is simple: keep the main weekly planner helpful for
                free, then build deeper tools for families who want more record
                keeping, more children, printables, exports, child portfolios,
                planning ahead, and backed-up accounts.
              </p>
            </div>
            <div className="beta-release-panel">
              <LuLock />
              <p>
                During beta, larger family and record-keeping features are free
                to test. If some tools become premium later, the core planner
                will still stay useful without forcing every family into a paid
                plan.
              </p>
              <Link className="btn btn-primary" href="/login?mode=create">
                Start beta account <LuArrowRight />
              </Link>
            </div>
          </div>

          <div className="marketing-plan-grid">
            <article className="plan-feature-card free-feature-card">
              <div className="plan-feature-top">
                <LuHeartHandshake />
                <div>
                  <span>Main planner stays useful</span>
                  <h3>Free foundation</h3>
                </div>
              </div>

              <p>
                SoftWeek should still help a family plan a real week without
                forcing them into a paid plan.
              </p>

              <ul>
                {freePlanFeatures.map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>
            </article>

            <article className="plan-feature-card premium-feature-card">
              <div className="plan-feature-top">
                <LuCrown />
                <div>
                  <span>Free to test during beta</span>
                  <h3>Premium later</h3>
                </div>
              </div>

              <p>
                These are the deeper tools that may become part of a premium
                plan once SoftWeek is ready for a fuller launch.
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
