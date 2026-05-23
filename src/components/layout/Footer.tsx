import Link from "next/link";
import { site } from "@/data/site";

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div>
          <p className="footer-brand">{site.name}</p>
          <p className="text-small">
            A softer homeschool planner for real-life weeks.
          </p>
        </div>

        <div className="footer-links">
          <Link href="/">Home</Link>
          <Link href="/planner">Demo</Link>
          <Link href="/beta">Beta</Link>
        </div>
      </div>
    </footer>
  );
}