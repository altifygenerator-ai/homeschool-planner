"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LuArrowRight, LuMousePointerClick, LuUserPlus } from "react-icons/lu";
import { getActiveAccountContext, startGuestSession, type AccountContext } from "@/lib/localAuth";

type AuthGateProps = {
  children: React.ReactNode;
};

export default function AuthGate({ children }: AuthGateProps) {
  const [context, setContext] = useState<AccountContext | null>(null);
  const [hasChecked, setHasChecked] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function refresh() {
      try {
        const nextContext = await getActiveAccountContext();
        if (isMounted) setContext(nextContext);
      } catch {
        if (isMounted) setContext(null);
      } finally {
        if (isMounted) setHasChecked(true);
      }
    }

    void refresh();
    window.addEventListener("softweek-session-changed", refresh);
    return () => {
      isMounted = false;
      window.removeEventListener("softweek-session-changed", refresh);
    };
  }, []);

  if (!hasChecked) return null;

  if (!context) {
    return (
      <section className="auth-required-card soft-card">
        <div>
          <p className="eyebrow">Account needed</p>
          <h1 className="section-title-sm">Open SoftWeek with a beta account or guest access.</h1>
          <p className="section-lead">
            Create a beta account to save your family setup and weekly records,
            log back in, or try the planner as a guest first.
          </p>
        </div>

        <div className="btn-row">
          <Link className="btn btn-primary" href="/login?mode=create">
            <LuUserPlus />
            Create account
          </Link>
          <button
            className="btn btn-secondary"
            type="button"
            onClick={() => {
              startGuestSession();
              void getActiveAccountContext()
                .then(setContext)
                .catch(() => setContext(null));
            }}
          >
            <LuMousePointerClick />
            Try as guest
          </button>
          <Link className="btn btn-secondary" href="/login?mode=login">
            Log in
            <LuArrowRight />
          </Link>
        </div>
      </section>
    );
  }

  return <>{children}</>;
}
