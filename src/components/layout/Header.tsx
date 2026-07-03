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
              <Button href="/login?mode=login">
                <LuLogIn />
                Log in
              </Button>

              <Button href="/login?mode=create" variant="secondary">
                Create account
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
