"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  LuArchive,
  LuArrowRight,
  LuCalendarDays,
  LuUsersRound,
  LuUserRound,
} from "react-icons/lu";
import { getActiveAccountContext, type AccountContext } from "@/lib/localAuth";
import { getChildren, getCurrentPlans, getSavedWeeks } from "@/lib/plannerStorage";
import type { PlannerItem, SavedWeekLog } from "@/types/planner";

export default function DashboardHome() {
  const [plans, setPlans] = useState<PlannerItem[]>([]);
  const [savedWeeks, setSavedWeeks] = useState<SavedWeekLog[]>([]);
  const [childCount, setChildCount] = useState(0);
  const [context, setContext] = useState<AccountContext | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      const [nextContext, nextPlans, nextSavedWeeks, nextChildren] = await Promise.all([
        getActiveAccountContext(),
        getCurrentPlans(),
        getSavedWeeks(),
        getChildren(),
      ]);

      if (!isMounted) return;
      setContext(nextContext);
      setPlans(nextPlans);
      setSavedWeeks(nextSavedWeeks);
      setChildCount(nextChildren.filter((child) => child.id !== "everyone").length);
    }

    void load();
    return () => {
      isMounted = false;
    };
  }, []);

  const doneCount = plans.filter((plan) => plan.status === "done").length;
  const movedCount = plans.filter((plan) => plan.status === "moved").length;
  const skippedCount = plans.filter((plan) => plan.status === "skipped").length;

  return (
    <div className="dashboard-page-grid">
      <section className="dashboard-hero-card soft-card">
        <div>
          <p className="eyebrow">{context?.isChild ? "Child dashboard" : "Family dashboard"}</p>
          <h2 className="section-title-sm">
            {context?.isChild ? "Your week is ready to check." : "Your family workspace is ready."}
          </h2>
          <p className="section-lead">
            {context?.isChild
              ? "Open the planner to mark work done, skip what needs skipped, and add quick notes about what happened."
              : "Open the planner, add children, build a soft 7-day week, and save a simple record of what happened."}
          </p>
        </div>

        <div className="dashboard-stat-row">
          <div>
            <strong>{plans.length}</strong>
            <span>plans</span>
          </div>
          <div>
            <strong>{doneCount}</strong>
            <span>done</span>
          </div>
          <div>
            <strong>{movedCount}</strong>
            <span>moved</span>
          </div>
          <div>
            <strong>{skippedCount}</strong>
            <span>skipped</span>
          </div>
        </div>

        <Link className="btn btn-primary" href="/dashboard/planner">
          Open planner
          <LuArrowRight />
        </Link>
      </section>

      <section className="dashboard-card-grid">
        <Link className="dashboard-link-card paper-card" href="/dashboard/planner">
          <LuCalendarDays />
          <h3>Open planner</h3>
          <p>Add loose plans, move cards, mark what happened, and save the week.</p>
          <span>Current week</span>
        </Link>

        <Link className="dashboard-link-card paper-card" href="/dashboard/weeks">
          <LuArchive />
          <h3>Saved weeks</h3>
          <p>View weekly records and the short rundowns created for each child.</p>
          <span>{savedWeeks.length} saved</span>
        </Link>

        <Link className="dashboard-link-card paper-card" href="/dashboard/children">
          <LuUsersRound />
          <h3>Children</h3>
          <p>Manage child profiles and optional limited child accounts.</p>
          <span>{childCount} profiles</span>
        </Link>

        <Link className="dashboard-link-card paper-card" href="/dashboard/account">
          <LuUserRound />
          <h3>Account</h3>
          <p>Review your access, family stats, saved records, and free or premium feature direction.</p>
          <span>Overview</span>
        </Link>
      </section>
    </div>
  );
}
