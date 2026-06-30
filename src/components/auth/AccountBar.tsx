"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
    function refresh() {
      setContext(getActiveAccountContext());
    }

    refresh();
    window.addEventListener("softweek-session-changed", refresh);
    return () => window.removeEventListener("softweek-session-changed", refresh);
  }, []);

  if (!context) return null;

  return (
    <div className="account-bar">
      <div className="account-pill">
        <LuUserRound />
        <span>
          {context.account.name} · {context.isChild ? "Child view" : context.isGuest ? "Guest" : "Parent"}
        </span>
      </div>

      <button
        className="mini-text-button"
        type="button"
        onClick={() => {
          signOutLocalAccount();
          router.push("/login?mode=login");
        }}
      >
        <LuLogOut />
        Sign out
      </button>
    </div>
  );
}
