import Link from "next/link";
import { LuNotebookPen } from "react-icons/lu";
import { site } from "@/data/site";
import Button from "@/components/shared/Button";

export default function Header() {
  return (
    <header className="site-header">
      <div className="header-inner">
        <Link href="/" className="logo-mark" aria-label={`${site.name} home`}>
          <span className="logo-icon">
            <LuNotebookPen />
          </span>
          <span>{site.name}</span>
        </Link>

        <nav className="nav-links" aria-label="Main navigation">
          {site.nav.map((item) => (
            <Link href={item.href} key={item.label}>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="header-actions">
          <Button href="/dashboard/planner">Open planner</Button>
          <Button href="/beta" variant="secondary">Feedback</Button>
        </div>
      </div>
    </header>
  );
}