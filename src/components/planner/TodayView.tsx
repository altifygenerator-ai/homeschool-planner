"use client";

import { LuCalendarDays } from "react-icons/lu";
import PlanCard from "@/components/planner/PlanCard";
import { dayLabels, timeBlocks, weekDays } from "@/data/demoPlans";
import type {
  CategoryDefinition,
  ChildProfile,
  PlanCategory,
  PlannerItem,
  PlanStatus,
  TimeBlock,
  WeekDay,
} from "@/types/planner";

type TodayViewProps = {
  plans: PlannerItem[];
  childProfiles: ChildProfile[];
  categories: CategoryDefinition[];
  weekStart: string;
  focusedDay: WeekDay;
  activeChildId: string;
  isChildView?: boolean;
  onDayChange: (day: WeekDay) => void;
  onChildChange: (childId: string) => void;
  onStatusChange: (id: string, status: PlanStatus) => void;
  onActualNotesChange: (id: string, value: string) => void;
  onOpenCalendar?: () => void;
  showDayPicker?: boolean;
};

function dateForDay(weekStart: string, day: WeekDay) {
  const start = new Date(`${weekStart.slice(0, 10)}T12:00:00`);
  const index = weekDays.indexOf(day);
  const next = new Date(start);
  next.setDate(start.getDate() + Math.max(index, 0));
  return next;
}

function formatDate(value: Date) {
  return value.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

function formatShortDate(value: Date) {
  return value.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function isSameDate(left: Date, right: Date) {
  return left.toISOString().slice(0, 10) === right.toISOString().slice(0, 10);
}

function filterForChild(plans: PlannerItem[], childId: string) {
  if (childId === "all") return plans;
  if (childId === "everyone")
    return plans.filter((plan) => plan.assignedTo === "everyone");

  return plans.filter(
    (plan) => plan.assignedTo === childId || plan.assignedTo === "everyone",
  );
}

function emptyHandler() {
  return undefined;
}

export default function TodayView({
  plans,
  childProfiles,
  categories,
  weekStart,
  focusedDay,
  activeChildId,
  isChildView = false,
  onDayChange,
  onChildChange,
  onStatusChange,
  onActualNotesChange,
  onOpenCalendar,
  showDayPicker = false,
}: TodayViewProps) {
  const focusedDate = dateForDay(weekStart, focusedDay);
  const today = new Date();
  const isToday = isSameDate(focusedDate, today);
  const dayPlans = filterForChild(
    plans.filter((plan) => plan.day === focusedDay),
    activeChildId,
  );

  const childFilterOptions = isChildView
    ? childProfiles.filter((child) => child.id !== "all")
    : childProfiles;

  return (
    <section className="today-shell soft-card">
      <div className="today-header">
        <div>
          <p className="eyebrow">{isToday ? "Today" : "Day view"}</p>
          <h2>{formatDate(focusedDate)}</h2>
          <p className="text-small">
            A clean look at what is planned for today. Switch between everyone
            or one child without changing the plan.
          </p>
        </div>

        <div className="today-count-card">
          <strong>{dayPlans.length}</strong>
          <span>{dayPlans.length === 1 ? "item" : "items"}</span>
        </div>
      </div>

      {showDayPicker ? (
        <div className="today-picker-row" aria-label="Pick a day in this week">
          {weekDays.map((day) => {
            const date = dateForDay(weekStart, day);
            const active = day === focusedDay;

            return (
              <button
                className={`today-day-button ${active ? "is-active" : ""}`}
                type="button"
                key={day}
                onClick={() => onDayChange(day)}
                aria-pressed={active}
              >
                <span>{dayLabels[day]}</span>
                <small>{formatShortDate(date)}</small>
              </button>
            );
          })}
        </div>
      ) : null}

      <div
        className="today-filter-row"
        aria-label="Filter today's plans by child"
      >
        {!isChildView ? (
          <button
            className={`child-chip ${activeChildId === "all" ? "active" : ""}`}
            type="button"
            onClick={() => onChildChange("all")}
          >
            All
          </button>
        ) : null}

        {childFilterOptions.map((child) => (
          <button
            className={`child-chip ${activeChildId === child.id ? "active" : ""}`}
            type="button"
            key={child.id}
            onClick={() => onChildChange(child.id)}
          >
            {child.name}
          </button>
        ))}
      </div>

      <div className="today-plan-panel">
        {dayPlans.length ? (
          timeBlocks.map((block: TimeBlock) => {
            const plansForBlock = dayPlans.filter(
              (plan) => plan.timeBlock === block,
            );
            if (!plansForBlock.length) return null;

            return (
              <div className="today-time-block" key={block}>
                <div className="today-time-heading">
                  <LuCalendarDays />
                  <span>{block}</span>
                </div>

                <div className="today-plan-list">
                  {plansForBlock.map((plan) => (
                    <PlanCard
                      key={plan.id}
                      plan={plan}
                      childProfiles={childProfiles}
                      categories={categories}
                      onMove={
                        emptyHandler as (id: string, day: WeekDay) => void
                      }
                      onCopy={
                        emptyHandler as (id: string, day: WeekDay) => void
                      }
                      onStatusChange={onStatusChange}
                      onCategoryChange={
                        emptyHandler as (
                          id: string,
                          category: PlanCategory,
                        ) => void
                      }
                      onActualNotesChange={onActualNotesChange}
                      onResourceChange={
                        emptyHandler as (
                          id: string,
                          values: {
                            resourceTitle?: string;
                            resourceUrl?: string;
                          },
                        ) => void
                      }
                      onDelete={emptyHandler as (id: string) => void}
                      canEditStructure={false}
                    />
                  ))}
                </div>
              </div>
            );
          })
        ) : (
          <div className="today-empty-card">
            <h3>Nothing planned for this view yet.</h3>
            <p>
              Add something from Calendar, or leave the day open. SoftWeek does
              not need every day packed full.
            </p>
            {onOpenCalendar ? (
              <button
                className="soft-action soft-action-filled"
                type="button"
                onClick={onOpenCalendar}
              >
                Open calendar
              </button>
            ) : null}
          </div>
        )}
      </div>
    </section>
  );
}
