import Link from "next/link";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

const betaEmail =
  "mailto:altifygenerator@gmail.com?subject=SoftWeek%20Beta%20Tester&body=Hey%2C%20I%20saw%20SoftWeek%20and%20I%27d%20be%20interested%20in%20testing%20it.%0A%0AA%20little%20about%20our%20homeschool%20setup%3A%0A%0AWhat%20I%20struggle%20with%20most%20in%20planning%3A%0A";

export default function BetaPage() {
  return (
    <main className="site-shell">
      <Header />

      <section className="section">
        <div className="container">
          <div className="section-center">
            <p className="eyebrow">Early tester list</p>
            <h1 className="section-title">
              Help shape a homeschool planner that feels less stressful.
            </h1>
            <p className="section-lead">
              SoftWeek is still early. Right now, the planner saves locally in
              your browser while the flow is being tested. I’m looking for
              homeschool parents who can click around, try the planner, and tell
              me what feels useful, confusing, or missing.
            </p>

            <div
              className="btn-row"
              style={{ justifyContent: "center", marginTop: "1.6rem" }}
            >
              <Link className="btn btn-primary" href={betaEmail}>
                Email me to test SoftWeek
              </Link>

              <Link className="btn btn-secondary" href="/dashboard/planner">
                Try the early planner
              </Link>
            </div>

            <p className="hero-note">
              No account system yet. No permanent cloud storage yet. This is the
              early testing version before adding Supabase accounts and saved
              family data.
            </p>
          </div>

          <div
            className="form-card"
            style={{
              maxWidth: "760px",
              margin: "2rem auto 0",
            }}
          >
            <div className="stack-md">
              <div>
                <p className="eyebrow">What I need feedback on</p>
                <h2 className="section-title-sm">
                  Does this actually solve the planning problem?
                </h2>
                <p className="text-soft">
                  I’m trying to find out if the weekly board, child assignments,
                  saved weeks, and child rundowns feel helpful before building
                  the full account system.
                </p>
              </div>

              <div className="feature-grid" style={{ marginTop: 0 }}>
                <article className="feature-card">
                  <h3 className="feature-title">Planning flow</h3>
                  <p className="feature-text">
                    Does adding, moving, skipping, and marking plans feel easier
                    than a normal planner?
                  </p>
                </article>

                <article className="feature-card">
                  <h3 className="feature-title">Saved weeks</h3>
                  <p className="feature-text">
                    Would saving a weekly log help you look back without
                    rebuilding everything later?
                  </p>
                </article>

                <article className="feature-card">
                  <h3 className="feature-title">Child records</h3>
                  <p className="feature-text">
                    Do the child rundowns and portfolio idea feel useful, or
                    should they work differently?
                  </p>
                </article>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}