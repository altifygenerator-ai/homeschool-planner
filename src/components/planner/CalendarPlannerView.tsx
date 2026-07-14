"use client";

import { ReactNode } from "react";
import {
  LuCalendarDays,
  LuChevronLeft,
  LuChevronRight,
  LuPlus,
} from "react-icons/lu";
import PlanCard from "@/components/planner/PlanCard";
import { dayLabels, timeBlocks, weekDays } from "@/data/demoPlans";
import type {
  CategoryDefinition,
  ChildProfile,
  PlanCategory,
  PlannerItem,
  PlanStatus,
  WeekDay,
} from "@/types/planner";

type CalendarPlannerViewProps = {
  plans: PlannerItem[];
  childProfiles: ChildProfile[];
  categories: CategoryDefinition[];
  weekLabel: string;
  weekStart: string;
  selectedDay: WeekDay;
  activeChildId: string;
  isChildView?: boolean;
  canEditStructure?: boolean;
  jumpDate: string;
  isAddingPlan?: boolean;
  addPlanSlot?: ReactNode;
  onSelectDay: (day: WeekDay) => void;
  onChildChange: (childId: string) => void;
  onAddToDay: (day: WeekDay) => void;
  onSwitchWeek: (direction: number) => void;
  onThisWeek: () => void;
  onJumpDateChange: (value: string) => void;
  onPickWeek: () => void;
  onMove: (id: string, day: WeekDay) => void;
  onCopy: (id: string, day: WeekDay) => void;
  onStatusChange: (id: string, status: PlanStatus) => void;
  onCategoryChange: (id: string, category: PlanCategory) => void;
  onActualNotesChange: (id: string, value: string) => void;
  onResourceChange: (
    id: string,
    values: { resourceTitle?: string; resourceUrl?: string },
  ) => void;
  onDelete: (id: string) => void;
};

function dateForDay(weekStart: string, day: WeekDay) {
  const [year, month, date] = weekStart.slice(0, 10).split("-").map(Number);
  const start = new Date(year, month - 1, date, 12, 0, 0, 0);
  const index = weekDays.indexOf(day);
  const next = new Date(start);
  next.setDate(start.getDate() + Math.max(index, 0));
  return next;
}

function formatTileDate(value: Date) {
  return value.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function formatFullDate(value: Date) {
  return value.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

function filterForChild(plans: PlannerItem[], childId: string) {
  if (childId === "all") return plans;
  if (childId === "everyone")
    return plans.filter((plan) => plan.assignedTo === "everyone");

  return plans.filter(
    (plan) => plan.assignedTo === childId || plan.assignedTo === "everyone",
  );
}

export default function CalendarPlannerView({
  plans,
  childProfiles,
  categories,
  weekLabel,
  weekStart,
  selectedDay,
  activeChildId,
  isChildView = false,
  canEditStructure = true,
  jumpDate,
  isAddingPlan = false,
  addPlanSlot,
  onSelectDay,
  onChildChange,
  onAddToDay,
  onSwitchWeek,
  onThisWeek,
  onJumpDateChange,
  onPickWeek,
  onMove,
  onCopy,
  onStatusChange,
  onCategoryChange,
  onActualNotesChange,
  onResourceChange,
  onDelete,
}: CalendarPlannerViewProps) {
  const filteredPlans = filterForChild(plans, activeChildId);
  const selectedDate = dateForDay(weekStart, selectedDay);
  const selectedDayPlans = filteredPlans.filter(
    (plan) => plan.day === selectedDay,
  );
  const childOptions = isChildView
    ? childProfiles.filter((child) => child.id !== "all")
    : childProfiles;

  return (
    <section className="calendar-planner-shell">
      <div className="calendar-week-header soft-card">
        <div>
          <p className="eyebrow">Calendar</p>
          <h2>Week of {weekLabel}</h2>
          <p className="text-small">
            Pick a day first, then add or adjust what belongs on that day. The
            week stays editable anytime.
          </p>
        </div>

        <div className="calendar-week-controls">
          <div className="calendar-week-buttons">
            <button
              className="mini-text-button"
              type="button"
              onClick={() => onSwitchWeek(-1)}
            >
              <LuChevronLeft />
              Previous
            </button>
            <button
              className="mini-text-button"
              type="button"
              onClick={onThisWeek}
            >
              This week
            </button>
            <button
              className="mini-text-button"
              type="button"
              onClick={() => onSwitchWeek(1)}
            >
              Next
              <LuChevronRight />
            </button>
          </div>

          {canEditStructure ? (
            <div className="calendar-date-jump">
              <label className="mini-field">
                <span>Jump to week</span>
                <input
                  type="date"
                  value={jumpDate}
                  onChange={(event) => onJumpDateChange(event.target.value)}
                />
              </label>
              <button
                className="soft-action"
                type="button"
                onClick={onPickWeek}
              >
                Open
              </button>
            </div>
          ) : null}
        </div>
      </div>

      <div className="calendar-filter-bar soft-card">
        {isChildView ? (
          <p className="text-small">
            Showing this child’s assigned items and anything marked for
            everyone.
          </p>
        ) : (
          <>
            <span>Show</span>
            <button
              className={`child-chip ${activeChildId === "all" ? "active" : ""}`}
              type="button"
              onClick={() => onChildChange("all")}
            >
              All
            </button>
            {childOptions.map((child) => (
              <button
                className={`child-chip ${activeChildId === child.id ? "active" : ""}`}
                type="button"
                key={child.id}
                onClick={() => onChildChange(child.id)}
              >
                {child.name}
              </button>
            ))}
          </>
        )}
      </div>

      <div className="calendar-day-grid" aria-label="Week calendar">
        {weekDays.map((day) => {
          const dayPlans = filteredPlans.filter((plan) => plan.day === day);
          const active = day === selectedDay;
          const date = dateForDay(weekStart, day);

          return (
            <button
              key={day}
              type="button"
              className={`calendar-day-tile ${active ? "is-active" : ""}`}
              onClick={() => onSelectDay(day)}
              aria-pressed={active}
            >
              <span className="calendar-day-name">{dayLabels[day]}</span>
              <strong>{formatTileDate(date)}</strong>
              <small>
                {dayPlans.length} {dayPlans.length === 1 ? "item" : "items"}
              </small>
              <div className="calendar-day-preview">
                {dayPlans.slice(0, 3).map((plan) => (
                  <span key={plan.id}>{plan.title}</span>
                ))}
                {dayPlans.length > 3 ? (
                  <em>+{dayPlans.length - 3} more</em>
                ) : null}
                {!dayPlans.length ? <em>Open day</em> : null}
              </div>
            </button>
          );
        })}
      </div>

      <section className="calendar-day-detail soft-card">
        <div className="calendar-day-detail-header">
          <div>
            <p className="eyebrow">Day view</p>
            <h2>{formatFullDate(selectedDate)}</h2>
            <p className="text-small">
              {selectedDayPlans.length
                ? `${selectedDayPlans.length} item${selectedDayPlans.length === 1 ? "" : "s"} for this view.`
                : "Nothing planned for this view yet."}
            </p>
          </div>

          {canEditStructure ? (
            <button
              className="btn btn-primary"
              type="button"
              onClick={() => onAddToDay(selectedDay)}
            >
              <LuPlus />
              Add item to {dayLabels[selectedDay]}
            </button>
          ) : null}
        </div>

        {isAddingPlan && canEditStructure ? (
          <div className="calendar-day-add-slot">{addPlanSlot}</div>
        ) : null}

        {selectedDayPlans.length ? (
          <div className="calendar-day-plan-groups">
            {timeBlocks.map((block) => {
              const plansForBlock = selectedDayPlans.filter(
                (plan) => plan.timeBlock === block,
              );
              if (!plansForBlock.length) return null;

              return (
                <div className="calendar-time-group" key={block}>
                  <div className="today-time-heading">
                    <LuCalendarDays />
                    <span>{block}</span>
                  </div>

                  <div className="calendar-day-plan-list">
                    {plansForBlock.map((plan) => (
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
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="today-empty-card">
            <h3>This day is open.</h3>
            <p>
              Add a lesson, chore, routine, outing, or appointment when you need
              it. Empty days are okay too.
            </p>
          </div>
        )}
      </section>
    </section>
  );
}
