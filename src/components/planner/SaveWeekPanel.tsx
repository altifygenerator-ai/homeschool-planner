"use client";

import { LuArchive, LuBookOpenCheck } from "react-icons/lu";
import type { ChildProfile, PlannerItem, SavedWeekLog } from "@/types/planner";
import { createId } from "@/lib/utils";
import { getCurrentWeekRange } from "@/lib/week";
import { generateChildWeeklySummaries } from "@/lib/weeklySummary";

type SaveWeekPanelProps = {
  plans: PlannerItem[];
  childProfiles: ChildProfile[];
  onSaveWeek: (week: SavedWeekLog) => void;
};

export default function SaveWeekPanel({
  plans,
  childProfiles,
  onSaveWeek,
}: SaveWeekPanelProps) {
  const doneCount = plans.filter((plan) => plan.status === "done").length;
  const movedCount = plans.filter((plan) => plan.status === "moved").length;
  const skippedCount = plans.filter((plan) => plan.status === "skipped").length;
  const { weekLabel, weekStart, weekEnd } = getCurrentWeekRange();

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
    <section className="paper-card week-save-card">
      <div>
        <p className="eyebrow">Week record</p>
        <h2 className="section-title-sm">Save this week when it’s ready.</h2>
        <p className="text-soft">
          Save the current board as a weekly log with a short rundown for each
          child you added.
        </p>
      </div>

      <div className="week-stat-grid">
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
Save this week
      </button>

      <p className="text-small">
        <LuBookOpenCheck style={{ display: "inline", marginRight: "0.3rem" }} />
        Saved weeks stay in this browser during this testing version. You can
        still use them to try the weekly record flow.
      </p>
    </section>
  );
}