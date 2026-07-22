"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LuLogIn, LuLogOut, LuNotebookPen, LuUserRound } from "react-icons/lu";
import { site } from "@/data/site";
import Button from "@/components/shared/Button";
import {
  getActiveAccountContext,
  signOutLocalAccount,
  type AccountContext,
} from "@/lib/localAuth";

export default function Header() {
  const router = useRouter();
  const [context, setContext] = useState<AccountContext | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function refresh() {
      try {
        const nextContext = await getActiveAccountContext();
        if (isMounted) setContext(nextContext);
      } catch {
        if (isMounted) setContext(null);
      }
    }

    void refresh();
    window.addEventListener("softweek-session-changed", refresh);
    return () => {
      isMounted = false;
      window.removeEventListener("softweek-session-changed", refresh);
    };
  }, []);

  const nav = context
    ? context.isChild
      ? [
          { label: "Today", href: "/dashboard/planner?view=today" },
          { label: "Week", href: "/dashboard/planner?view=week" },
          { label: "Account", href: "/dashboard/account" },
        ]
      : [
          { label: "Today", href: "/dashboard/planner?view=today" },
          { label: "Week", href: "/dashboard/planner?view=week" },
          { label: "Records", href: "/dashboard/weeks" },
          { label: "Family", href: "/dashboard/children" },
        ]
    : site.nav;

  async function handleSignOut() {
    await signOutLocalAccount();
    setContext(null);
    router.push("/login?mode=login");
  }

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
            <>
              <Button href="/dashboard/account" variant="soft">
                <LuUserRound />
                Account
              </Button>

              <button
                className="btn btn-primary header-logout-button"
                type="button"
                onClick={handleSignOut}
              >
                <LuLogOut />
                Log out
              </button>
            </>
          ) : (
            <>
              <Button href="/login?mode=create">
                Create account
              </Button>

              <Button href="/login?mode=login" variant="secondary">
                <LuLogIn />
                Log in
              </Button>

              <Button href="/guest" variant="soft">
                Try guest
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
