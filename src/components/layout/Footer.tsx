import Link from "next/link";

export default function Footer() {
  return (
    <footer className="site-footer">
      <div><strong>SoftWeek</strong><p>A flexible homeschool weekly planner that keeps the record without making more work.</p></div>
      <nav><Link href="/login?mode=create">Create account</Link><Link href="/guest">Try guest</Link><a href="mailto:support@softweekplanner.com">Feedback</a></nav>
    </footer>
  );
}
