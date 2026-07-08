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
  const quickStartSteps = [
    {
      label: "Add children",
      text: "Add the kids you want to plan for.",
      href: "/dashboard/children",
      done: childCount > 0,
    },
    {
      label: "Add a plan",
      text: "Put one real thing on the week.",
      href: "/dashboard/planner",
      done: plans.length > 0,
    },
    {
      label: "Mark what happened",
      text: "Try done, moved, skipped, or a short note.",
      href: "/dashboard/planner",
      done: doneCount + movedCount + skippedCount > 0,
    },
    {
      label: "Save the week",
      text: "Save a record when the week is ready.",
      href: "/dashboard/planner",
      done: savedWeeks.length > 0,
    },
  ];
  const nextStep = quickStartSteps.find((step) => !step.done);

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

      {context?.isParent ? (
        <section className="paper-card parent-start-card">
          <div>
            <p className="eyebrow">Quick start</p>
            <h2>Keep it simple the first time through.</h2>
            <p>
              You do not need to set everything up at once. Add a child, add a
              plan, move or mark something, then save the week when it makes sense.
            </p>
          </div>

          <div className="parent-start-steps">
            {quickStartSteps.map((step, index) => (
              <Link
                className={`parent-start-step ${step.done ? "is-done" : ""}`}
                href={step.href}
                key={step.label}
              >
                <span>{step.done ? "✓" : index + 1}</span>
                <div>
                  <strong>{step.label}</strong>
                  <small>{step.text}</small>
                </div>
              </Link>
            ))}
          </div>

          <Link className="mini-text-button parent-next-step" href={nextStep?.href || "/dashboard/weeks"}>
            {nextStep ? `Next: ${nextStep.label}` : "Review saved weeks"}
            <LuArrowRight />
          </Link>
        </section>
      ) : null}

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
