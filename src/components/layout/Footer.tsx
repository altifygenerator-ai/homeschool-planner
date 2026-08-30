import Link from "next/link";

export default function Footer() {
  return (
    <footer className="site-footer">
      <div><strong>SoftWeek</strong><p>Load the curriculum once, keep the next lesson moving, and let completed work build the record.</p></div>
      <nav><Link href="/login?mode=create">Create account</Link><Link href="/guest">Try guest</Link><a href="mailto:support@softweekplanner.com">Feedback</a></nav>
    </footer>
  );
}
