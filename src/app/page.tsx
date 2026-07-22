import Image from "next/image";
import Link from "next/link";
import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";

const loop = [
  ["1", "Capture it", "Put work in This Week before deciding where it belongs."],
  ["2", "Place it lightly", "Schedule only what needs a day. Leave the rest flexible."],
  ["3", "Use Today", "Open the app and see the work that matters now."],
  ["4", "Recover", "When plans change, move unfinished work together."],
  ["5", "Keep the record", "Completed work and notes become the weekly record automatically."],
];

export default function Home() {
  return (
    <main className="site-shell">
      <Header />

      <section className="marketing-hero">
        <div className="marketing-hero-copy">
          <p className="sw-kicker">A homeschool week is allowed to change.</p>
          <h1>Plan the week without being trapped by it.</h1>
          <p className="marketing-hero-text">
            Keep lessons, routines, outings, and real-life learning in one flexible week.
            When life changes the plan, SoftWeek helps you move the work and keep the
            record without entering everything twice.
          </p>
          <div className="btn-row">
            <Link className="btn btn-primary" href="/login?mode=create">Start planning</Link>
            <Link className="btn btn-secondary" href="/guest">Try it without an account</Link>
          </div>
          <p className="marketing-small-note">The core promise: less work than winging it.</p>
        </div>

        <div className="marketing-product-stage" aria-label="Preview of the SoftWeek planner">
          <div className="marketing-product-window">
            <div className="marketing-window-bar" aria-hidden="true">
              <span /><span /><span />
              <strong>SoftWeek weekly planner</strong>
            </div>
            <Image
              className="marketing-preview-wide"
              src="/pwa-screenshot-wide.png"
              alt="SoftWeek week view showing This Week, weekly tools, and daily homeschool plans"
              width={1280}
              height={651}
              priority
              sizes="(max-width: 720px) 1px, (max-width: 1100px) 90vw, 520px"
            />
            <Image
              className="marketing-preview-mobile"
              src="/pwa-screenshot-mobile.png"
              alt="SoftWeek mobile Today view with quick add and unfinished work"
              width={540}
              height={901}
              priority
              sizes="(max-width: 720px) 86vw, 1px"
            />
          </div>
          <div className="marketing-product-note">
            <strong>When the day changes</strong>
            <span>Move unfinished work together instead of cleaning up every item one at a time.</span>
          </div>
        </div>
      </section>

      <section className="marketing-problem" id="life-happened">
        <div>
          <p className="sw-kicker">The problem is not planning.</p>
          <h2>The problem is having to rebuild the plan every time the week changes.</h2>
        </div>
        <p>
          A child needs more time. An appointment takes the morning. Everyone is tired.
          A field trip replaces the book work. Most planners make the parent clean up
          every card one at a time, then enter completed work again for records. SoftWeek
          is built around that exact break in the week.
        </p>
      </section>

      <section className="marketing-recovery-story" aria-label="How Life Happened recovers a changed week">
        <div className="recovery-before">
          <span>Tuesday morning</span>
          <h3>Five unfinished items</h3>
          <p>The day changed. The plan did not happen.</p>
        </div>
        <div className="recovery-arrow" aria-hidden="true">→</div>
        <div className="recovery-after">
          <span>Life Happened</span>
          <h3>Spread the work over the remaining days</h3>
          <p>Preview the move, apply it once, and undo it when needed.</p>
        </div>
      </section>

      <section className="marketing-loop" id="weekly-loop">
        <header>
          <p className="sw-kicker">The weekly loop</p>
          <h2>SoftWeek carries more of the mental load.</h2>
        </header>
        <div className="marketing-loop-list">
          {loop.map(([number, title, text]) => (
            <article key={number}>
              <span>{number}</span>
              <div><h3>{title}</h3><p>{text}</p></div>
            </article>
          ))}
        </div>
      </section>

      <section className="marketing-views" id="planner-views">
        <div className="marketing-view-copy">
          <p className="sw-kicker">Built around real use</p>
          <h2>Today for doing. Week for planning. Records as a byproduct.</h2>
          <p>
            SoftWeek does not start with course setup, grading rules, or a school-year
            wizard. Add one useful item first. Children, categories, rhythms, and lesson
            stacks are there when they actually help.
          </p>
        </div>
        <div className="marketing-notebook-list">
          <div><strong>This Week</strong><span>A holding area for work without a weekday.</span></div>
          <div><strong>Weekly Rhythm</strong><span>Repeat normal parts of family life without recurrence jargon.</span></div>
          <div><strong>Lesson Stacks</strong><span>Keep ordered lessons ready without scheduling months ahead.</span></div>
          <div><strong>Automatic Records</strong><span>What was done, moved, skipped, and noted stays in the record.</span></div>
        </div>
      </section>

      <section className="marketing-fit" id="fit">
        <div>
          <p className="sw-kicker">A deliberate boundary</p>
          <h2>It is not trying to become a school management system.</h2>
        </div>
        <ul>
          <li>No required gradebook</li>
          <li>No streak pressure or guilt badges</li>
          <li>No curriculum marketplace</li>
          <li>No complicated setup before the first useful plan</li>
        </ul>
      </section>

      <section className="marketing-final">
        <p className="sw-kicker">Plan lightly. Recover quickly.</p>
        <h2>Give the week enough structure to help, not enough to trap you.</h2>
        <div className="btn-row">
          <Link className="btn btn-primary" href="/login?mode=create">Create a SoftWeek account</Link>
          <Link className="btn btn-secondary" href="/login?mode=login">Log in</Link>
        </div>
        <p>SoftWeek is in active beta. Real family feedback is shaping what stays simple and what gets built next.</p>
      </section>

      <Footer />
    </main>
  );
}
