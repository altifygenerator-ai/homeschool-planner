import Link from "next/link";
import { LuMail } from "react-icons/lu";
import { site } from "@/data/site";

const contactEmail = "support@softweekplanner.com";
const contactHref =
  "mailto:support@softweekplanner.com?subject=SoftWeek Planner Feedback";

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-main">
          <p className="footer-brand">{site.name}</p>
          <p className="footer-copy">
            A simple weekly planner for homeschool plans, moved lessons, useful
            links, saved records, and binder-friendly printouts.
          </p>
        </div>

        <div className="footer-contact-card">
          <div>
            <p className="footer-contact-title">Have a comment or suggestion?</p>
            <p className="footer-contact-text">
              SoftWeek is still being shaped with homeschool family feedback.
              Send what feels helpful, confusing, unnecessary, or missing.
            </p>

            <a className="footer-email" href={contactHref}>
              <LuMail />
              {contactEmail}
            </a>
          </div>

          <a className="footer-contact-btn" href={contactHref}>
            Send feedback
          </a>
        </div>

        <div className="footer-links">
          <Link href="/">Home</Link>
          <Link href="/login?mode=create">Create account</Link>
          <Link href="/guest">Try guest</Link>
          <Link href="/login?mode=login">Log in</Link>
        </div>
      </div>
    </footer>
  );
}
