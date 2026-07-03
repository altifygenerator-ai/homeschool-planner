"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LuNotebookPen, LuUserRound } from "react-icons/lu";
import { site } from "@/data/site";
import Button from "@/components/shared/Button";
import { getActiveAccountContext, type AccountContext } from "@/lib/localAuth";

export default function Header() {
  const [context, setContext] = useState<AccountContext | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function refresh() {
      const nextContext = await getActiveAccountContext();
      if (isMounted) setContext(nextContext);
    }

    void refresh();
    window.addEventListener("softweek-session-changed", refresh);
    return () => {
      isMounted = false;
      window.removeEventListener("softweek-session-changed", refresh);
    };
  }, []);

  const nav = context
    ? [
        { label: "Planner", href: "/dashboard/planner" },
        { label: "Saved weeks", href: "/dashboard/weeks" },
        { label: "Children", href: "/dashboard/children" },
        { label: "Account", href: "/dashboard/account" },
      ]
    : site.nav;

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
          {nav.map((item) => (
            <Link href={item.href} key={item.label}>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="header-actions">
          {context ? (
            <Button href="/dashboard/account">
              <LuUserRound />
              Account
            </Button>
          ) : (
            <>
              <Button href="/login?mode=create">Create account</Button>
              <Button href="/guest" variant="secondary">
                Try guest
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
