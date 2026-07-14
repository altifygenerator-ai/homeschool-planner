"use client";

import { LuArchive } from "react-icons/lu";
import type { ChildProfile, PlannerItem, SavedWeekLog } from "@/types/planner";
import { createId } from "@/lib/utils";
import { generateChildWeeklySummaries } from "@/lib/weeklySummary";

type SaveWeekPanelProps = {
  plans: PlannerItem[];
  childProfiles: ChildProfile[];
  weekLabel: string;
  weekStart: string;
  weekEnd: string;
  onSaveWeek: (week: SavedWeekLog) => void;
};

export default function SaveWeekPanel({
  plans,
  childProfiles,
  weekLabel,
  weekStart,
  weekEnd,
  onSaveWeek,
}: SaveWeekPanelProps) {
  const doneCount = plans.filter((plan) => plan.status === "done").length;
  const movedCount = plans.filter((plan) => plan.status === "moved").length;
  const skippedCount = plans.filter((plan) => plan.status === "skipped").length;

  function handleSaveWeek() {
    const childSummaries = generateChildWeeklySummaries(childProfiles, plans);

    onSaveWeek({
      id: createId("week"),
      weekLabel,
      weekStart,
      weekEnd,
      savedAt: new Date().toISOString(),
      children: childProfiles,
      plans,
      childSummaries,
    });
  }

  return (
    <section className="paper-card week-save-card week-save-compact">
      <div className="week-save-copy">
        <p className="eyebrow">Week record</p>
        <h2 className="week-save-title">Record for {weekLabel}</h2>
        <p className="text-small">
          SoftWeek updates records automatically. Use this if you want to update it right now before printing or reviewing.
        </p>
      </div>

      <div className="week-stat-grid week-stat-grid-compact" aria-label="Current week counts">
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

      <button className="btn btn-primary" type="button" onClick={handleSaveWeek} disabled={!plans.length}>
        <LuArchive />
        Update record now
      </button>
    </section>
  );
}
