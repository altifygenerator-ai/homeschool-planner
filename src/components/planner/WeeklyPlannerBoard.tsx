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
  weekStart: string;
  onAddToDay?: (day: WeekDay) => void;
  onMove: (id: string, day: WeekDay) => void;
  onCopy: (id: string, day: WeekDay) => void;
  onStatusChange: (id: string, status: PlanStatus) => void;
  onCategoryChange: (id: string, category: PlanCategory) => void;
  onActualNotesChange: (id: string, value: string) => void;
  onResourceChange: (id: string, values: { resourceTitle?: string; resourceUrl?: string }) => void;
  onDelete: (id: string) => void;
  canEditStructure?: boolean;
};

function dateForDay(weekStart: string, index: number) {
  const [year, month, date] = weekStart.slice(0, 10).split("-").map(Number);
  const start = new Date(year, month - 1, date, 12, 0, 0, 0);
  const next = new Date(start);
  next.setDate(start.getDate() + index);
  return next;
}

function formatShortDate(value: Date) {
  return value.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export default function WeeklyPlannerBoard({
  plans,
  childProfiles,
  categories,
  weekLabel,
  weekStart,
  onAddToDay,
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
    <section className="planner-board-shell planner-board-shell-calendar">
      <div className="planner-board-header planner-board-header-calendar">
        <div>
          <p className="eyebrow">Plan week</p>
          <h2 className="section-title-sm">Week of {weekLabel}</h2>
          <p className="planner-board-subtitle">
            Add items to the day they belong on. Use multi-day add when the same lesson, chore, or routine repeats.
          </p>
        </div>

        <div className="pill-row">
          <span className="pill pill-sage">{doneCount} done</span>
          <span className="pill pill-gold">{movedCount} moved</span>
          <span className="pill pill-clay">{skippedCount} skipped</span>
        </div>
      </div>

      <p className="mobile-board-hint">Swipe sideways to see the whole week.</p>

      <div className="weekly-board weekly-board-calendar">
        {weekDays.map((day, index) => (
          <DayColumn
            key={day}
            day={day}
            dateLabel={formatShortDate(dateForDay(weekStart, index))}
            plans={plans.filter((plan) => plan.day === day)}
            childProfiles={childProfiles}
            categories={categories}
            onAddToDay={onAddToDay}
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
