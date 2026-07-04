"use client";

import DayColumn from "@/components/planner/DayColumn";
import { weekDays } from "@/data/demoPlans";
import type {
  CategoryDefinition,
  ChildProfile,
  PlanCategory,
  PlannerItem,
  PlanStatus,
  WeekDay,
} from "@/types/planner";

type WeeklyPlannerBoardProps = {
  plans: PlannerItem[];
  childProfiles: ChildProfile[];
  categories: CategoryDefinition[];
  weekLabel: string;
  onMove: (id: string, day: WeekDay) => void;
  onCopy: (id: string, day: WeekDay) => void;
  onStatusChange: (id: string, status: PlanStatus) => void;
  onCategoryChange: (id: string, category: PlanCategory) => void;
  onActualNotesChange: (id: string, value: string) => void;
  onResourceChange: (id: string, values: { resourceTitle?: string; resourceUrl?: string }) => void;
  onDelete: (id: string) => void;
  canEditStructure?: boolean;
};

export default function WeeklyPlannerBoard({
  plans,
  childProfiles,
  categories,
  weekLabel,
  onMove,
  onCopy,
  onStatusChange,
  onCategoryChange,
  onActualNotesChange,
  onResourceChange,
  onDelete,
  canEditStructure = true,
}: WeeklyPlannerBoardProps) {
  const doneCount = plans.filter((plan) => plan.status === "done").length;
  const movedCount = plans.filter((plan) => plan.status === "moved").length;
  const skippedCount = plans.filter((plan) => plan.status === "skipped").length;

  return (
    <section className="planner-board-shell">
      <div className="planner-board-header">
        <div>
          <p className="eyebrow">This week</p>
          <h2 className="section-title-sm">A 7-day week that can move with you.</h2>
          <p className="planner-board-subtitle">
            {weekLabel} · Weekdays, weekends, field trips, life lessons, and catch-up days can all live on the same board.
          </p>
        </div>

        <div className="pill-row">
          <span className="pill pill-sage">{doneCount} done</span>
          <span className="pill pill-gold">{movedCount} moved</span>
          <span className="pill pill-clay">{skippedCount} skipped</span>
        </div>
      </div>

      <div className="weekly-board">
        {weekDays.map((day) => (
          <DayColumn
            key={day}
            day={day}
            plans={plans.filter((plan) => plan.day === day)}
            childProfiles={childProfiles}
            categories={categories}
            onMove={onMove}
            onCopy={onCopy}
            onStatusChange={onStatusChange}
            onCategoryChange={onCategoryChange}
            onActualNotesChange={onActualNotesChange}
            onResourceChange={onResourceChange}
            onDelete={onDelete}
            canEditStructure={canEditStructure}
          />
        ))}
      </div>
    </section>
  );
}
