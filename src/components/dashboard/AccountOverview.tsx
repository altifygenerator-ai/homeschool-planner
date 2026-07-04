"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  LuArchive,
  LuArrowRight,
  LuCalendarDays,
  LuCrown,
  LuFileText,
  LuHeartHandshake,
  LuLock,
  LuPrinter,
  LuSparkles,
  LuUserRound,
  LuUsersRound,
} from "react-icons/lu";
import {
  getAccountsForActiveFamily,
  getActiveAccountContext,
  type AccountContext,
  type LocalAccount,
} from "@/lib/localAuth";
import {
  getChildren,
  getCurrentPlans,
  getSavedWeeks,
} from "@/lib/plannerStorage";
import type { ChildProfile, PlannerItem, SavedWeekLog } from "@/types/planner";

const alwaysFreeFeatures = [
  "A simple parent account",
  "Try as guest before creating an account",
  "One child profile for basic planning",
  "The weekly planner board",
  "7-day planning with move, done, and skipped statuses",
  "Custom categories for real homeschool subjects",
  "A limited saved-week history for basic records",
  "A simple print view for the current week",
];

const premiumLaterFeatures = [
  "Multiple children and fuller family workspaces",
  "Long-term saved week history",
  "Printable month and year summaries",
  "Reusable week templates and copy-week tools",
  "PDF exports",
  "Child portfolio views and record summaries",
  "Optional older-kid accounts with limited permissions",
  "Saved records across devices",
  "Planning-ahead tools like month glance and duplicate week",
];

function formatDate(value?: string) {
  if (!value) return "Not started";

  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getMonthKey(value: string) {
  const date = new Date(value);
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function getYearKey(value: string) {
  return String(new Date(value).getFullYear());
}

function getMonthParam(value: string) {
  const date = new Date(value);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export default function AccountOverview() {
  const [context, setContext] = useState<AccountContext | null>(null);
  const [children, setChildren] = useState<ChildProfile[]>([]);
  const [plans, setPlans] = useState<PlannerItem[]>([]);
  const [savedWeeks, setSavedWeeks] = useState<SavedWeekLog[]>([]);
  const [accounts, setAccounts] = useState<LocalAccount[]>([]);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      const [nextContext, nextChildren, nextPlans, nextSavedWeeks, nextAccounts] = await Promise.all([
        getActiveAccountContext(),
        getChildren(),
        getCurrentPlans(),
        getSavedWeeks(),
        getAccountsForActiveFamily(),
      ]);

      if (!isMounted) return;
      setContext(nextContext);
      setChildren(nextChildren.filter((child) => child.id !== "everyone"));
      setPlans(nextPlans);
      setSavedWeeks(nextSavedWeeks);
      setAccounts(nextAccounts);
    }

    void load();
    return () => {
      isMounted = false;
    };
  }, []);

  const childLogins = accounts.filter((account) => account.role === "child");
  const doneCount = plans.filter((plan) => plan.status === "done").length;
  const movedCount = plans.filter((plan) => plan.status === "moved").length;
  const skippedCount = plans.filter((plan) => plan.status === "skipped").length;

  const savedPlanCount = savedWeeks.reduce(
    (total, week) => total + week.plans.length,
    0
  );

  const latestSavedWeek = savedWeeks[0];
  const latestMonthParam = latestSavedWeek ? getMonthParam(latestSavedWeek.weekStart) : "";
  const latestYearParam = latestSavedWeek ? getYearKey(latestSavedWeek.weekStart) : "";

  const monthRecords = useMemo(() => {
    const map = new Map<string, { label: string; weeks: number; plans: number }>();

    savedWeeks.forEach((week) => {
      const label = getMonthKey(week.weekStart || week.savedAt);
      const current = map.get(label) ?? { label, weeks: 0, plans: 0 };
      current.weeks += 1;
      current.plans += week.plans.length;
      map.set(label, current);
    });

    return Array.from(map.values()).slice(0, 4);
  }, [savedWeeks]);

  const yearRecords = useMemo(() => {
    const map = new Map<string, { label: string; weeks: number; plans: number }>();

    savedWeeks.forEach((week) => {
      const label = getYearKey(week.weekStart || week.savedAt);
      const current = map.get(label) ?? { label, weeks: 0, plans: 0 };
      current.weeks += 1;
      current.plans += week.plans.length;
      map.set(label, current);
    });

    return Array.from(map.values()).slice(0, 4);
  }, [savedWeeks]);

  const accountLabel = useMemo(() => {
    if (!context) return "Beta access";
    if (context.isGuest) return "Guest";
    if (context.isChild) return "Child view";
    return context.access.label;
  }, [context]);

  return (
    <div className="account-overview-stack">
      <section className="soft-card account-overview-hero">
        <div>
          <p className="eyebrow">Account overview</p>
          <h2 className="section-title-sm">
            {context?.isChild
              ? "Your limited SoftWeek view."
              : "Your SoftWeek family workspace."}
          </h2>
          <p className="section-lead">
            {context?.isChild
              ? "Older-kid accounts are meant to help kids check their own week without giving them full parent controls."
              : "This page gives you a quick look at your current week, saved records, child profiles, and account options."}
          </p>
        </div>

        <div className="account-plan-card">
          <div className="account-plan-icon">
            {context?.isGuest ? <LuUserRound /> : <LuSparkles />}
          </div>
          <div>
            <span>Current access</span>
            <strong>{accountLabel}</strong>
            <p>
              {context?.isGuest
                ? "Guest mode is for trying the planner before making an account."
                : context?.access.dataSafetyNote ?? "Beta access is free while SoftWeek is being tested and shaped by real homeschool feedback."}
            </p>
          </div>
        </div>
      </section>

      <section className="account-stat-grid">
        <article className="paper-card account-stat-card">
          <LuCalendarDays />
          <span>Current week</span>
          <strong>{plans.length}</strong>
          <p>{doneCount} done · {movedCount} moved · {skippedCount} skipped</p>
        </article>

        <article className="paper-card account-stat-card">
          <LuUsersRound />
          <span>Children</span>
          <strong>{children.length}</strong>
          <p>{childLogins.length} optional child accounts</p>
        </article>

        <article className="paper-card account-stat-card">
          <LuArchive />
          <span>Saved weeks</span>
          <strong>{savedWeeks.length}</strong>
          <p>{savedPlanCount} saved plans in records</p>
        </article>

        <article className="paper-card account-stat-card">
          <LuFileText />
          <span>Latest record</span>
          <strong>{latestSavedWeek ? latestSavedWeek.weekLabel : "None yet"}</strong>
          <p>{latestSavedWeek ? `Saved ${formatDate(latestSavedWeek.savedAt)}` : "Save a week to start history"}</p>
        </article>
      </section>

      <section className="account-action-grid">
        <Link className="dashboard-link-card paper-card" href="/dashboard/planner">
          <LuCalendarDays />
          <h3>Open planner</h3>
          <p>Plan this week, move what changes, mark what happened, and keep the board flexible.</p>
          <span>Go to planner</span>
        </Link>

        <Link className="dashboard-link-card paper-card" href="/dashboard/weeks">
          <LuArchive />
          <h3>Saved records</h3>
          <p>Review saved weeks and the child rundowns that grow into printable records.</p>
          <span>{savedWeeks.length} saved</span>
        </Link>

        <Link className="dashboard-link-card paper-card" href={latestMonthParam ? `/dashboard/print?period=month&month=${latestMonthParam}` : "/dashboard/weeks"}>
          <LuPrinter />
          <h3>Print records</h3>
          <p>Print a week, month, or year overview for a physical homeschool folder.</p>
          <span>{latestYearParam ? `Latest year: ${latestYearParam}` : "Save a week first"}</span>
        </Link>

        <Link className="dashboard-link-card paper-card" href="/dashboard/children">
          <LuUsersRound />
          <h3>Family setup</h3>
          <p>Add children, review profiles, and create limited child accounts when you want them.</p>
          <span>{children.length} children</span>
        </Link>
      </section>

      <section className="soft-card beta-plan-section">
        <div className="beta-plan-heading">
          <p className="eyebrow">Weekly, monthly, yearly</p>
          <h2 className="section-title-sm">Saved weeks build into printable month and year records.</h2>
          <p className="section-lead">
            Each saved week adds to your family history. You can print a single week for a notebook, or print a simple month-to-month or year overview from the records you have saved.
          </p>
        </div>

        <div className="account-stat-grid account-record-grid">
          <article className="paper-card account-stat-card">
            <LuArchive />
            <span>Weekly records</span>
            <strong>{savedWeeks.length}</strong>
            <p>Saved week snapshots</p>
          </article>

          <article className="paper-card account-stat-card">
            <LuCalendarDays />
            <span>Monthly overviews</span>
            <strong>{monthRecords.length}</strong>
            <p>{monthRecords[0] ? `${monthRecords[0].label} has ${monthRecords[0].weeks} saved week${monthRecords[0].weeks === 1 ? "" : "s"}` : "Save weeks to build months"}</p>
          </article>

          <article className="paper-card account-stat-card">
            <LuFileText />
            <span>Yearly overviews</span>
            <strong>{yearRecords.length}</strong>
            <p>{yearRecords[0] ? `${yearRecords[0].label} has ${yearRecords[0].plans} saved plans` : "Save weeks to build years"}</p>
          </article>
        </div>
      </section>

      <section className="soft-card beta-plan-section">
        <div className="beta-plan-heading">
          <p className="eyebrow">Free now, clear later</p>
          <h2 className="section-title-sm">The main planner will stay useful without forcing a paid plan.</h2>
          <p className="section-lead">
            During beta, the larger family and record-keeping features are free to test so families can help decide what actually matters. At full launch, the core weekly planner stays useful, and deeper tools may become premium.
          </p>
        </div>

        <div className="plan-feature-grid">
          <article className="plan-feature-card free-feature-card">
            <div className="plan-feature-top">
              <LuHeartHandshake />
              <div>
                <span>Always useful</span>
                <h3>Free plan foundation</h3>
              </div>
            </div>

            <p>
              SoftWeek should still help a small homeschool setup plan a real week, even without paying.
            </p>

            <ul>
              {alwaysFreeFeatures.map((feature) => (
                <li key={feature}>{feature}</li>
              ))}
            </ul>
          </article>

          <article className="plan-feature-card premium-feature-card">
            <div className="plan-feature-top">
              <LuCrown />
              <div>
                <span>Free during beta testing</span>
                <h3>Premium later</h3>
              </div>
            </div>

            <p>
              These are the features that create more long-term value for families who want fuller records, more children, and planning tools that go beyond the basic week.
            </p>

            <ul>
              {premiumLaterFeatures.map((feature) => (
                <li key={feature}>{feature}</li>
              ))}
            </ul>
          </article>
        </div>
      </section>

      <section className="paper-card account-beta-note">
        <LuLock />
        <div>
          <p className="eyebrow">Record safety</p>
          <h3>Saved family records should not disappear because a plan changes later.</h3>
          <p>
            SoftWeek is set up so saved children, weeks, months, and yearly history can stay available. If a free plan has limits later, those limits should control adding new premium records, not erase records families already saved.
          </p>
        </div>
        <Link className="btn btn-primary" href="/beta">
          Send beta feedback <LuArrowRight />
        </Link>
      </section>

      {context?.isGuest ? (
        <section className="paper-card account-upgrade-note">
          <LuLock />
          <div>
            <h3>Guest mode is temporary.</h3>
            <p>
              Guest access is great for trying SoftWeek, but saved records should eventually live under a family account.
            </p>
          </div>
          <Link className="btn btn-secondary" href="/login?mode=create">
            Create account
          </Link>
        </section>
      ) : null}
    </div>
  );
}
