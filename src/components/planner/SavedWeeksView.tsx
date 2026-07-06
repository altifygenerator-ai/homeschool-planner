"use client";

import Link from "next/link";
import {
  LuCalendarDays,
  LuChevronDown,
  LuExternalLink,
  LuPrinter,
  LuTrash2,
} from "react-icons/lu";
import type { PlannerItem, SavedWeekLog } from "@/types/planner";

type SavedWeeksViewProps = {
  savedWeeks: SavedWeekLog[];
  onDeleteWeek?: (weekId: string) => void;
};

type SavedPlanItem = PlannerItem & {
  resourceUrl?: string;
  resourceTitle?: string;
  actualNotes?: string;
};

function dateOnly(value: string) {
  return value.slice(0, 10);
}

function getMonthParam(value: string) {
  const date = new Date(value);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function getYearParam(value: string) {
  return String(new Date(value).getFullYear());
}

function formatMonth(value: string) {
  return new Date(`${value}-01T12:00:00`).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

function getAssignedName(week: SavedWeekLog, plan: SavedPlanItem) {
  if (plan.assignedTo === "everyone") return "Everyone";
  return week.children.find((child) => child.id === plan.assignedTo)?.name ?? "Child";
}

function planStatusLabel(status?: PlannerItem["status"]) {
  if (status === "done") return "Done";
  if (status === "moved") return "Moved";
  if (status === "skipped") return "Skipped";
  return "Planned";
}

export default function SavedWeeksView({
  savedWeeks,
  onDeleteWeek,
}: SavedWeeksViewProps) {
  const latestWeek = savedWeeks[0];
  const latestMonth = latestWeek ? getMonthParam(latestWeek.weekStart) : "";
  const latestYear = latestWeek ? getYearParam(latestWeek.weekStart) : "";

  if (!savedWeeks.length) {
    return (
      <section className="paper-card saved-weeks-card">
        <p className="eyebrow">Saved weeks</p>
        <h2 className="section-title-sm">No saved weeks yet.</h2>
        <p className="text-soft">
          Once you save a week, it will show here with child rundowns, saved
          plans, notes, resources, and simple print options.
        </p>
      </section>
    );
  }

  return (
    <section className="paper-card saved-weeks-card">
      <div className="saved-weeks-topline">
        <div>
          <p className="eyebrow">Saved weeks</p>
          <h2 className="section-title-sm">Your weekly records</h2>
          <p className="text-small">
            Open a saved week to review the plans, notes, resources, and child
            rundowns before printing for your notebook or folder.
          </p>
        </div>

        <div className="record-print-actions">
          {latestMonth ? (
            <Link
              className="soft-action soft-action-filled"
              href={`/dashboard/print?period=month&month=${latestMonth}`}
            >
              <LuCalendarDays />
              Print {formatMonth(latestMonth)}
            </Link>
          ) : null}

          {latestYear ? (
            <Link
              className="soft-action"
              href={`/dashboard/print?period=year&year=${latestYear}`}
            >
              <LuPrinter />
              Print {latestYear}
            </Link>
          ) : null}
        </div>
      </div>

      <div className="saved-week-list">
        {savedWeeks.map((week) => (
          <article className="saved-week-item" key={week.id}>
            <div className="saved-week-header">
              <div>
                <h3>{week.weekLabel}</h3>
                <p>
                  Saved{" "}
                  {new Date(week.savedAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </p>
              </div>

              <div className="saved-week-actions">
                <span>{week.plans.length} plans</span>

                <Link
                  className="print-week-button"
                  href={`/dashboard/print?period=week&weekStart=${dateOnly(
                    week.weekStart
                  )}`}
                >
                  <LuPrinter />
                  Print
                </Link>

                {onDeleteWeek ? (
                  <button
                    className="delete-week-button"
                    type="button"
                    onClick={() => onDeleteWeek(week.id)}
                    aria-label={`Delete saved week ${week.weekLabel}`}
                  >
                    <LuTrash2 />
                    Delete
                  </button>
                ) : null}
              </div>
            </div>

            <div className="child-summary-list">
              {week.childSummaries.map((summary) => (
                <div className="child-summary-card" key={summary.childId}>
                  <h4>{summary.childName}</h4>
                  <p>{summary.summary}</p>

                  <div className="pill-row">
                    <span className="pill pill-sage">
                      {summary.completedCount} done
                    </span>
                    <span className="pill pill-gold">
                      {summary.movedCount} moved
                    </span>
                    <span className="pill pill-clay">
                      {summary.skippedCount} skipped
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <details className="saved-week-detail">
              <summary className="saved-week-detail-toggle">
                <span>
                  <LuChevronDown />
                  View saved plans
                </span>
                <small>{week.plans.length} saved plans</small>
              </summary>

              {week.plans.length ? (
                <div className="saved-plan-list">
                  {week.plans.map((savedPlan) => {
                    const plan = savedPlan as SavedPlanItem;
                    const status = plan.status ?? "planned";

                    return (
                      <div className="saved-plan-card" key={plan.id}>
                        <div className="saved-plan-card-top">
                          <div>
                            <p className="saved-plan-day">{plan.day}</p>
                            <h4>{plan.title}</h4>
                          </div>

                          <span
                            className={`saved-plan-status saved-plan-status-${status}`}
                          >
                            {planStatusLabel(status)}
                          </span>
                        </div>

                        <div className="saved-plan-meta">
                          <span>{getAssignedName(week, plan)}</span>
                          <span>{plan.timeBlock}</span>
                          <span>{plan.category}</span>
                        </div>

                        {plan.notes || plan.actualNotes ? (
                          <div className="saved-plan-notes">
                            {plan.notes ? (
                              <p>
                                <strong>Plan note:</strong> {plan.notes}
                              </p>
                            ) : null}

                            {plan.actualNotes ? (
                              <p>
                                <strong>Record note:</strong> {plan.actualNotes}
                              </p>
                            ) : null}
                          </div>
                        ) : null}

                        {plan.resourceUrl ? (
                          <a
                            className="saved-plan-resource"
                            href={plan.resourceUrl}
                            target="_blank"
                            rel="noreferrer"
                          >
                            <LuExternalLink />
                            {plan.resourceTitle || "Open resource"}
                          </a>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="template-empty-note">
                  This saved week has a record, but no plan details were saved
                  with it.
                </p>
              )}
            </details>
          </article>
        ))}
      </div>
    </section>
  );
}
