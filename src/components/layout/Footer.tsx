import Link from "next/link";
import { LuMail, LuMessageCircle } from "react-icons/lu";
import { site } from "@/data/site";

const contactEmail = "altifygenerator@gmail.com";
const contactHref =
  "mailto:altifygenerator@gmail.com?subject=SoftWeek Planner Feedback";

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-main">
          <p className="footer-brand">{site.name}</p>
          <p className="footer-copy">
            A softer homeschool planner for flexible weeks, simple records, and
            real-life learning.
          </p>
        </div>

        <div className="footer-contact-card">
          <div>
            <p className="footer-contact-title">
              Have a comment or suggestion?
            </p>
            <p className="footer-contact-text">
              SoftWeek is still being shaped with homeschool family feedback.
              Send over what feels helpful, confusing, or missing.
            </p>

            <a className="footer-email" href={contactHref}>
              <LuMail />
              {contactEmail}
            </a>
          </div>

          <a className="footer-contact-btn" href={contactHref}>
            <LuMessageCircle />
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