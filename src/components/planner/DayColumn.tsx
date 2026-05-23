"use client";

import PlanCard from "@/components/planner/PlanCard";
import type {
  PlanCategory,
  PlannerItem,
  PlanStatus,
  WeekDay,
} from "@/types/planner";

type DayColumnProps = {
  day: WeekDay;
  plans: PlannerItem[];
  onMove: (id: string, day: WeekDay) => void;
  onStatusChange: (id: string, status: PlanStatus) => void;
  onCategoryChange: (id: string, category: PlanCategory) => void;
  onActualNotesChange: (id: string, value: string) => void;
  onDelete: (id: string) => void;
};

export default function DayColumn({
  day,
  plans,
  onMove,
  onStatusChange,
  onCategoryChange,
  onActualNotesChange,
  onDelete,
}: DayColumnProps) {
  return (
    <section className="day-column">
      <div className="day-column-header">
        <p>{day}</p>
        <span>{plans.length}</span>
      </div>

      <div className="day-column-list">
        {plans.length ? (
          plans.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              onMove={onMove}
              onStatusChange={onStatusChange}
              onCategoryChange={onCategoryChange}
              onActualNotesChange={onActualNotesChange}
              onDelete={onDelete}
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