"use client";

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
  plans: PlannerItem[];
  childProfiles: ChildProfile[];
  categories: CategoryDefinition[];
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
  plans,
  childProfiles,
  categories,
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
    <section className="day-column">
      <div className="day-column-header">
        <p>{dayLabels[day]}</p>
        <span>{plans.length}</span>
      </div>

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
            <p>No pressure here.</p>
            <span>Add something, or leave the day open.</span>
          </div>
        )}
      </div>
    </section>
  );
}
