"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  LuArchive,
  LuArrowRight,
  LuCalendarDays,
  LuFileText,
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
import { getChildren, getCurrentPlans, getSavedWeeks } from "@/lib/plannerStorage";
import type { ChildProfile, PlannerItem, SavedWeekLog } from "@/types/planner";
import ReminderPreferences from "@/components/dashboard/ReminderPreferences";

function formatDate(value?: string) {
  if (!value) return "Not started";
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
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
  const [records, setRecords] = useState<SavedWeekLog[]>([]);
  const [accounts, setAccounts] = useState<LocalAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  async function loadAccount() {
    setLoading(true);
    setErrorMessage("");
    try {
      const nextContext = await getActiveAccountContext();
      const [nextChildren, nextPlans] = await Promise.all([
        getChildren(),
        getCurrentPlans(),
      ]);
      const [nextRecords, nextAccounts] = nextContext?.isChild
        ? [[], []] as [SavedWeekLog[], LocalAccount[]]
        : await Promise.all([getSavedWeeks(), getAccountsForActiveFamily()]);

      setContext(nextContext);
      setChildren(nextChildren.filter((child) => child.id !== "everyone"));
      setPlans(nextPlans);
      setRecords(nextRecords);
      setAccounts(nextAccounts);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Your account details could not be loaded.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadAccount();
  }, []);

  const childLogins = accounts.filter((account) => account.role === "child");
  const doneCount = plans.filter((plan) => plan.status === "done").length;
  const unfinishedCount = plans.filter((plan) => plan.status !== "done" && plan.status !== "skipped").length;
  const latestRecord = records[0];
  const latestMonthParam = latestRecord ? getMonthParam(latestRecord.weekStart) : "";
  const latestYearParam = latestRecord ? getYearKey(latestRecord.weekStart) : "";

  const accountLabel = useMemo(() => {
    if (!context) return "Beta access";
    if (context.isGuest) return "Guest";
    if (context.isChild) return "Child view";
    return context.access.label;
  }, [context]);

  if (loading) {
    return (
      <section className="soft-card account-loading-card" aria-busy="true">
        <p className="eyebrow">Account</p>
        <h2 className="section-title-sm">Loading your family planner…</h2>
      </section>
    );
  }

  if (errorMessage) {
    return (
      <section className="soft-card account-error-card" role="alert">
        <p className="eyebrow">Account</p>
        <h2 className="section-title-sm">Your account page did not finish loading.</h2>
        <p>{errorMessage}</p>
        <button className="btn btn-primary" type="button" onClick={() => void loadAccount()}>Try again</button>
      </section>
    );
  }

  return (
    <div className="account-overview-stack">
      <section className="soft-card account-overview-hero">
        <div>
          <p className="eyebrow">Account</p>
          <h2 className="section-title-sm">
            {context?.isChild ? "Your SoftWeek view." : "Your family planner settings."}
          </h2>
          <p className="section-lead">
            {context?.isChild
              ? "See the work assigned to you without opening parent-only planning, records, or billing controls."
              : "Manage family access, reminders, and printable records without adding more setup to the weekly planner."}
          </p>
        </div>

        <div className="account-plan-card">
          <div className="account-plan-icon" aria-hidden="true">
            {context?.isGuest ? <LuUserRound /> : <LuSparkles />}
          </div>
          <div>
            <span>Current access</span>
            <strong>{accountLabel}</strong>
            <p>
              {context?.isGuest
                ? "Guest plans stay in this browser. Create an account when you need them on another device."
                : context?.access.dataSafetyNote ?? "SoftWeek is free while the beta is being shaped by real family use."}
            </p>
          </div>
        </div>
      </section>

      <section className={`account-summary-strip${context?.isChild ? " is-child" : ""}`} aria-label="Account summary">
        <div><LuCalendarDays aria-hidden="true" /><span>This week</span><strong>{doneCount} done · {unfinishedCount} open</strong></div>
        {context?.isChild ? (
          <div><LuLock aria-hidden="true" /><span>Your access</span><strong>{accountLabel}</strong></div>
        ) : (
          <>
            <div><LuUsersRound aria-hidden="true" /><span>Family</span><strong>{children.length} children · {childLogins.length} child logins</strong></div>
            <div><LuArchive aria-hidden="true" /><span>Records</span><strong>{records.length} weekly records</strong></div>
            <div><LuFileText aria-hidden="true" /><span>Latest</span><strong>{latestRecord ? `${latestRecord.weekLabel} · ${formatDate(latestRecord.savedAt)}` : "Built automatically as you plan"}</strong></div>
          </>
        )}
      </section>

      <section className="account-action-list" aria-label="Account actions">
        <Link href="/dashboard/planner?view=today">
          <LuCalendarDays aria-hidden="true" />
          <span><strong>Open Today</strong><small>See what matters now and deal with unfinished work.</small></span>
          <LuArrowRight aria-hidden="true" />
        </Link>
        {context?.isChild ? (
          <Link href="/dashboard/planner?view=week">
            <LuCalendarDays aria-hidden="true" />
            <span><strong>Open your week</strong><small>See assigned work and move it only when your access allows.</small></span>
            <LuArrowRight aria-hidden="true" />
          </Link>
        ) : (
          <>
            <Link href="/dashboard/children">
              <LuUsersRound aria-hidden="true" />
              <span><strong>Family access</strong><small>Add children and choose Checklist, Flexible, or Independent access.</small></span>
              <LuArrowRight aria-hidden="true" />
            </Link>
            <Link href="/dashboard/weeks">
              <LuArchive aria-hidden="true" />
              <span><strong>Weekly records</strong><small>Review completed work, notes, resources, and carry-forward history.</small></span>
              <LuArrowRight aria-hidden="true" />
            </Link>
            <Link href={latestMonthParam ? `/dashboard/print?period=month&month=${latestMonthParam}` : "/dashboard/weeks"}>
              <LuPrinter aria-hidden="true" />
              <span><strong>Print records</strong><small>{latestYearParam ? `Print the latest month or ${latestYearParam} overview.` : "Records become printable after you use the planner."}</small></span>
              <LuArrowRight aria-hidden="true" />
            </Link>
          </>
        )}
      </section>

      {!context?.isChild ? <ReminderPreferences /> : null}

      <section className="paper-card account-beta-note">
        <LuLock aria-hidden="true" />
        <div>
          <p className="eyebrow">Record safety</p>
          <h3>Changing next week should not rewrite what already happened.</h3>
          <p>Weekly records are separate from the active plan, so later schedule changes do not erase the history you already built.</p>
        </div>
        <Link className="btn btn-secondary" href="/beta">Beta details <LuArrowRight aria-hidden="true" /></Link>
      </section>

      {context?.isGuest ? (
        <section className="paper-card account-upgrade-note">
          <LuLock aria-hidden="true" />
          <div><h3>Guest mode stays on this device.</h3><p>Create an account before switching browsers or devices.</p></div>
          <Link className="btn btn-primary" href="/login?mode=create">Create account</Link>
        </section>
      ) : null}
    </div>
  );
}
