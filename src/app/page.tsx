import Link from "next/link";
import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";

const loop = [
  ["1", "Load a course", "Paste the lesson list once or create a simple numbered sequence."],
  ["2", "Choose the normal days", "Tell SoftWeek when Math, Reading, Science, and the rest usually happen."],
  ["3", "Open Today", "SoftWeek surfaces the next unfinished lesson instead of making you maintain a dated calendar."],
  ["4", "Finish or adapt", "Complete it, log something different, or let the next lesson wait when life changes."],
  ["5", "Keep the record", "Finished work becomes the weekly record as you go."],
];

export default function Home() {
  return (
    <main className="site-shell">
      <Header />

      <section className="marketing-hero">
        <div className="marketing-hero-copy">
          <p className="sw-kicker">A homeschool planner you do not have to babysit.</p>
          <h1>Load the curriculum once. Keep the next lesson moving.</h1>
          <p className="marketing-hero-text">
            Paste your lesson sequence, choose the days you normally do the subject, and
            SoftWeek keeps the next lesson ready. Miss Tuesday? Nothing becomes late.
            What you finish becomes your record.
          </p>
          <div className="btn-row">
            <Link className="btn btn-primary" href="/login?mode=create">Start free</Link>
            <Link className="btn btn-secondary" href="/guest">Try the sample planner</Link>
          </div>
          <p className="marketing-small-note">No giant school setup. No fake due dates to repair.</p>
        </div>

        <div className="marketing-course-demo" aria-label="Preview of a SoftWeek course and today&apos;s work">
          <div className="marketing-course-demo-top">
            <strong>Math · Teaching Textbooks 6</strong>
            <span>Emma</span>
          </div>
          <div className="marketing-course-demo-body">
            <div className="marketing-course-progress">
              <div><strong>18 / 120 lessons complete</strong><small>15%</small></div>
              <div className="marketing-course-progress-bar" aria-hidden="true"><span /></div>
            </div>
            <div className="marketing-next-card">
              <span>Next lesson</span>
              <strong>Lesson 19</strong>
              <div className="marketing-next-days" aria-label="Normal course days">
                <span>M</span><span>T</span><span>W</span><span>T</span>
              </div>
            </div>
            <div className="marketing-today-demo">
              <p>Today · 2 things ready</p>
              <div><i aria-hidden="true" /><span><strong>Reading</strong><small>Chapter 7</small></span></div>
              <div><i aria-hidden="true" /><span><strong>Math</strong><small>Lesson 19</small></span></div>
            </div>
          </div>
          <p className="marketing-course-note"><strong>Tuesday disappeared?</strong> Nothing is overdue. The next lesson is still next.</p>
        </div>
      </section>

      <section className="marketing-problem" id="courses">
        <div>
          <p className="sw-kicker">Plan the sequence, not every date.</p>
          <h2>Curriculum already has an order. SoftWeek remembers where you are.</h2>
        </div>
        <p>
          Add Math, Reading, Science, or any course and give SoftWeek the lessons in order.
          It keeps one next lesson moving through your normal rhythm instead of assigning
          the whole year to dates that will probably change.
        </p>
      </section>

      <section className="marketing-recovery-story" aria-label="How SoftWeek handles a changed homeschool day">
        <div className="recovery-before">
          <span>Normal Tuesday</span>
          <h3>Math would happen today</h3>
          <p>SoftWeek knows Lesson 19 is next.</p>
        </div>
        <div className="recovery-arrow" aria-hidden="true">→</div>
        <div className="recovery-after">
          <span>Life happened</span>
          <h3>Lesson 19 stays next</h3>
          <p>No overdue warning. No rebuilding the rest of the curriculum.</p>
        </div>
      </section>

      <section className="marketing-loop" id="how-it-works">
        <header>
          <p className="sw-kicker">The SoftWeek loop</p>
          <h2>Set it up once, then use it where the school day actually happens.</h2>
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

      <section className="marketing-views" id="today-records">
        <div className="marketing-view-copy">
          <p className="sw-kicker">Four simple places</p>
          <h2>Today for doing. Courses for what comes next. Week for exceptions. Records for what happened.</h2>
          <p>
            You can still plan one-off work, field trips, appointments, and loose ends.
            The difference is that normal curriculum does not need to be recreated every week.
          </p>
        </div>
        <div className="marketing-notebook-list">
          <div><strong>Today</strong><span>See the next useful work without digging through a calendar.</span></div>
          <div><strong>Courses</strong><span>Track ordered lessons and simple progress for each child.</span></div>
          <div><strong>Week</strong><span>Handle one-offs and real-life changes without making them the whole system.</span></div>
          <div><strong>Records</strong><span>Completed work and notes quietly build a usable weekly history.</span></div>
        </div>
      </section>

      <section className="marketing-fit" id="fit">
        <div>
          <p className="sw-kicker">Built for families, not school administration.</p>
          <h2>SoftWeek stays intentionally light.</h2>
        </div>
        <ul>
          <li>No required gradebook</li>
          <li>No streak pressure or guilt badges</li>
          <li>No curriculum marketplace</li>
          <li>No months of dates to repair when a child needs more time</li>
        </ul>
      </section>

      <section className="marketing-final">
        <p className="sw-kicker">The next lesson is enough.</p>
        <h2>Stop maintaining the planner and get back to the homeschool day.</h2>
        <div className="btn-row">
          <Link className="btn btn-primary" href="/login?mode=create">Create a free SoftWeek account</Link>
          <Link className="btn btn-secondary" href="/guest">Try the sample first</Link>
        </div>
        <p>SoftWeek is in active beta. The core planner is free while real family use shapes what comes next.</p>
      </section>

      <Footer />
    </main>
  );
}
