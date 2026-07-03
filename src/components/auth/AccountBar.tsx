"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LuLogOut, LuUserRound } from "react-icons/lu";
import {
  getActiveAccountContext,
  signOutLocalAccount,
  type AccountContext,
} from "@/lib/localAuth";

export default function AccountBar() {
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

  if (!context) return null;

  return (
    <div className="account-bar">
      <Link className="account-pill" href="/dashboard/account">
        <LuUserRound />
        <span>
          {context.account.name} · {context.isChild ? "Child view" : context.isGuest ? "Guest" : context.access.label}
        </span>
      </Link>

      <button
        className="mini-text-button"
        type="button"
        onClick={async () => {
          await signOutLocalAccount();
          router.push("/login?mode=login");
        }}
      >
        <LuLogOut />
        Sign out
      </button>
    </div>
  );
}
