"use client";

import Link from "next/link";
import { LuCalendarDays, LuPrinter, LuTrash2 } from "react-icons/lu";
import type { SavedWeekLog } from "@/types/planner";

type SavedWeeksViewProps = {
  savedWeeks: SavedWeekLog[];
  onDeleteWeek?: (weekId: string) => void;
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
          Once you save a week, it will show here with short child rundowns and simple print options.
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
            Print one week for a notebook, or print a gentle month or year overview from your saved weeks.
          </p>
        </div>

        <div className="record-print-actions">
          {latestMonth ? (
            <Link className="soft-action soft-action-filled" href={`/dashboard/print?period=month&month=${latestMonth}`}>
              <LuCalendarDays />
              Print {formatMonth(latestMonth)}
            </Link>
          ) : null}

          {latestYear ? (
            <Link className="soft-action" href={`/dashboard/print?period=year&year=${latestYear}`}>
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

                <Link className="print-week-button" href={`/dashboard/print?period=week&weekStart=${dateOnly(week.weekStart)}`}>
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
          </article>
        ))}
      </div>
    </section>
  );
}
