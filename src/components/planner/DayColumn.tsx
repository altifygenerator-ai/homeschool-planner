"use client";

import { LuPlus } from "react-icons/lu";
import PlanCard from "@/components/planner/PlanCard";
import { dayLabels } from "@/data/demoPlans";
import type {
  CategoryDefinition,
  ChildProfile,
  PlanCategory,
  PlannerItem,
  PlanStatus,
  WeekDay,
} from "@/types/planner";

type DayColumnProps = {
  day: WeekDay;
  dateLabel: string;
  plans: PlannerItem[];
  childProfiles: ChildProfile[];
  categories: CategoryDefinition[];
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

export default function DayColumn({
  day,
  dateLabel,
  plans,
  childProfiles,
  categories,
  onAddToDay,
  onMove,
  onCopy,
  onStatusChange,
  onCategoryChange,
  onActualNotesChange,
  onResourceChange,
  onDelete,
  canEditStructure = true,
}: DayColumnProps) {
  return (
    <section className="day-column day-column-dated">
      <div className="day-column-header day-column-header-dated">
        <div>
          <p>{dayLabels[day]}</p>
          <small>{dateLabel}</small>
        </div>
        <span>{plans.length}</span>
      </div>

      {canEditStructure && onAddToDay ? (
        <button className="day-add-button" type="button" onClick={() => onAddToDay(day)}>
          <LuPlus />
          Add item
        </button>
      ) : null}

      <div className="day-column-list">
        {plans.length ? (
          plans.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
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
          ))
        ) : (
          <div className="empty-day-card">
            <p>Open day.</p>
            <span>{canEditStructure ? "Add something here when you need it." : "Nothing assigned here yet."}</span>
          </div>
        )}
      </div>
    </section>
  );
}
