"use client";

import { LuArchive, LuBookOpenCheck } from "react-icons/lu";
import type { ChildProfile, PlannerItem, SavedWeekLog } from "@/types/planner";
import { createId } from "@/lib/utils";
import { getCurrentWeekRange } from "@/lib/week";
import { generateChildWeeklySummaries } from "@/lib/weeklySummary";

type SaveWeekPanelProps = {
  plans: PlannerItem[];
  children: ChildProfile[];
  onSaveWeek: (week: SavedWeekLog) => void;
};

export default function SaveWeekPanel({
  plans,
  children,
  onSaveWeek,
}: SaveWeekPanelProps) {
  const doneCount = plans.filter((plan) => plan.status === "done").length;
  const movedCount = plans.filter((plan) => plan.status === "moved").length;
  const skippedCount = plans.filter((plan) => plan.status === "skipped").length;
  const { weekLabel, weekStart, weekEnd } = getCurrentWeekRange();

  function handleSaveWeek() {
    const childSummaries = generateChildWeeklySummaries(children, plans);

    onSaveWeek({
      id: createId("week"),
      weekLabel,
      weekStart,
      weekEnd,
      savedAt: new Date().toISOString(),
      children,
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
          This turns the current board into a saved weekly log and creates a
          short rundown for each child.
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

      <button className="btn btn-primary" type="button" onClick={handleSaveWeek}>
        <LuArchive />
        Save week log
      </button>

      <p className="text-small">
        <LuBookOpenCheck style={{ display: "inline", marginRight: "0.3rem" }} />
        Demo mode: saved weeks are stored in this browser for now. Later this
        becomes Supabase storage.
      </p>
    </section>
  );
}