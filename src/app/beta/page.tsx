import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

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
              This beta page is a placeholder for now. The first version will
              collect interest from homeschool parents who want a softer way to
              log activities, clean up notes, and keep weekly records.
            </p>
          </div>

          <div
            className="form-card"
            style={{
              maxWidth: "680px",
              margin: "2rem auto 0",
            }}
          >
            <form className="form-grid">
              <div className="field-group">
                <label className="field-label" htmlFor="name">
                  Name
                </label>
                <input
                  className="input"
                  id="name"
                  placeholder="Your name"
                  type="text"
                />
              </div>

              <div className="field-group">
                <label className="field-label" htmlFor="email">
                  Email
                </label>
                <input
                  className="input"
                  id="email"
                  placeholder="you@example.com"
                  type="email"
                />
              </div>

              <div className="field-group">
                <label className="field-label" htmlFor="message">
                  What feels hardest about homeschool planning right now?
                </label>
                <textarea
                  className="textarea"
                  id="message"
                  placeholder="Planning ahead, logging what we did, keeping records, feeling behind..."
                />
              </div>

              <button className="btn btn-primary" type="button">
                Join beta list
              </button>

              <p className="text-small">
                This form is visual only for the first MVP pass. We’ll wire it
                up later once the landing page direction feels right.
              </p>
            </form>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}