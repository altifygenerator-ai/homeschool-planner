"use client";

import { LuTrash2 } from "react-icons/lu";
import type { SavedWeekLog } from "@/types/planner";

type SavedWeeksViewProps = {
  savedWeeks: SavedWeekLog[];
  onDeleteWeek?: (weekId: string) => void;
};

export default function SavedWeeksView({
  savedWeeks,
  onDeleteWeek,
}: SavedWeeksViewProps) {
  if (!savedWeeks.length) {
    return (
      <section className="paper-card saved-weeks-card">
        <p className="eyebrow">Saved weeks</p>
        <h2 className="section-title-sm">No saved weeks yet.</h2>
        <p className="text-soft">
          Once you save a week, it will show here with short child rundowns.
        </p>
      </section>
    );
  }

  return (
    <section className="paper-card saved-weeks-card">
      <div>
        <p className="eyebrow">Saved weeks</p>
        <h2 className="section-title-sm">Your weekly records</h2>
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