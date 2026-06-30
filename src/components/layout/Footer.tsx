import Link from "next/link";
import { site } from "@/data/site";

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div>
          <p className="footer-brand">{site.name}</p>
          <p className="text-small">
            A softer homeschool planner for flexible weeks, simple records, and
            real-life learning.
          </p>
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
