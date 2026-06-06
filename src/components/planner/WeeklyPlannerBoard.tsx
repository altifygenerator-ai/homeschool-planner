"use client";

import DayColumn from "@/components/planner/DayColumn";
import { weekDays } from "@/data/demoPlans";
import type {
  ChildProfile,
  PlanCategory,
  PlannerItem,
  PlanStatus,
  WeekDay,
} from "@/types/planner";

type WeeklyPlannerBoardProps = {
  plans: PlannerItem[];
  childProfiles: ChildProfile[];
  onMove: (id: string, day: WeekDay) => void;
  onStatusChange: (id: string, status: PlanStatus) => void;
  onCategoryChange: (id: string, category: PlanCategory) => void;
  onActualNotesChange: (id: string, value: string) => void;
  onDelete: (id: string) => void;
};

export default function WeeklyPlannerBoard({
  plans,
  childProfiles,
  onMove,
  onStatusChange,
  onCategoryChange,
  onActualNotesChange,
  onDelete,
}: WeeklyPlannerBoardProps) {
  const doneCount = plans.filter((plan) => plan.status === "done").length;
  const movedCount = plans.filter((plan) => plan.status === "moved").length;
  const skippedCount = plans.filter((plan) => plan.status === "skipped").length;

  return (
    <section className="planner-board-shell">
      <div className="planner-board-header">
        <div>
          <p className="eyebrow">This week</p>
          <h2 className="section-title-sm">A week that can move with you.</h2>
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
            onMove={onMove}
            onStatusChange={onStatusChange}
            onCategoryChange={onCategoryChange}
            onActualNotesChange={onActualNotesChange}
            onDelete={onDelete}
          />
        ))}
      </div>
    </section>
  );
}