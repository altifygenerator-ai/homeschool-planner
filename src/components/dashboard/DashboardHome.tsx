"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  LuArchive,
  LuArrowRight,
  LuCalendarDays,
  LuUsersRound,
} from "react-icons/lu";
import { demoChildren } from "@/data/demoChildren";
import { getCurrentPlans, getSavedWeeks } from "@/lib/plannerStorage";
import type { PlannerItem, SavedWeekLog } from "@/types/planner";

export default function DashboardHome() {
  const [plans, setPlans] = useState<PlannerItem[]>([]);
  const [savedWeeks, setSavedWeeks] = useState<SavedWeekLog[]>([]);

  useEffect(() => {
    setPlans(getCurrentPlans());
    setSavedWeeks(getSavedWeeks());
  }, []);

  const doneCount = plans.filter((plan) => plan.status === "done").length;
  const movedCount = plans.filter((plan) => plan.status === "moved").length;
  const skippedCount = plans.filter((plan) => plan.status === "skipped").length;
  const childCount = demoChildren.filter((child) => child.id !== "everyone").length;

  return (
    <div className="dashboard-page-grid">
      <section className="dashboard-hero-card soft-card">
        <div>
          <p className="eyebrow">This week</p>
          <h2 className="section-title-sm">
            Your current week is still flexible.
          </h2>
          <p className="section-lead">
            Keep planning gently, move things when life changes, and save the
            week when it feels ready.
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
          Continue planning
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
          <p>See each child’s portfolio preview and saved learning history.</p>
          <span>{childCount} profiles</span>
        </Link>
      </section>
    </div>
  );
}