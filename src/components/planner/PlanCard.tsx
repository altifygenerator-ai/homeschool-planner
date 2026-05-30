"use client";

import { useState } from "react";
import {
  LuBookOpen,
  LuCalculator,
  LuCheck,
  LuChevronDown,
  LuChevronUp,
  LuLeaf,
  LuMap,
  LuMoveRight,
  LuPalette,
  LuSoup,
  LuX,
} from "react-icons/lu";
import {
  categories,
  categoryLabels,
  dayLabels,
  weekDays,
} from "@/data/demoPlans";
import type {
  ChildProfile,
  PlanCategory,
  PlannerItem,
  PlanStatus,
  WeekDay,
} from "@/types/planner";

type PlanCardProps = {
  plan: PlannerItem;
  children: ChildProfile[];
  onMove: (id: string, day: WeekDay) => void;
  onStatusChange: (id: string, status: PlanStatus) => void;
  onCategoryChange: (id: string, category: PlanCategory) => void;
  onActualNotesChange: (id: string, value: string) => void;
  onDelete: (id: string) => void;
};

const categoryIcons = {
  reading: LuBookOpen,
  math: LuCalculator,
  nature: LuLeaf,
  "life-skills": LuSoup,
  creative: LuPalette,
  outing: LuMap,
  other: LuMoveRight,
};

function getStatusLabel(status: PlanStatus) {
  if (status === "planned") return "Planned";
  if (status === "done") return "Done";
  if (status === "moved") return "Moved";
  return "Skipped";
}

export default function PlanCard({
  plan,
  children,
  onMove,
  onStatusChange,
  onCategoryChange,
  onActualNotesChange,
  onDelete,
}: PlanCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const Icon = categoryIcons[plan.category];
  const assignedChild =
    children.find((child) => child.id === plan.assignedTo)?.name ?? "Everyone";

  return (
    <article className={`plan-card plan-card-${plan.status}`}>
      <div className="plan-card-header">
        <div className="activity-dot">
          <Icon />
        </div>

        <div className="plan-card-copy">
          <div className="plan-title-row">
            <p className="activity-title">{plan.title}</p>
            <span className={`status-badge status-badge-${plan.status}`}>
              {getStatusLabel(plan.status)}
            </span>
          </div>

          <div className="plan-meta-stack">
            <span>{categoryLabels[plan.category]}</span>
            <span>{plan.timeBlock}</span>
          </div>
        </div>
      </div>

      <div className="assigned-pill">For {assignedChild}</div>

      {plan.notes ? <p className="plan-notes">{plan.notes}</p> : null}

      {plan.actualNotes ? (
        <div className="actual-note">
          <p>What happened</p>
          <span>{plan.actualNotes}</span>
        </div>
      ) : null}

      <div className="plan-card-actions">
        <button
          className="soft-action"
          type="button"
          onClick={() => onStatusChange(plan.id, "done")}
        >
          <LuCheck />
          Done
        </button>

        <button
          className="soft-action"
          type="button"
          onClick={() => onStatusChange(plan.id, "skipped")}
        >
          <LuX />
          Skip
        </button>

        <button
          className="soft-action"
          type="button"
          onClick={() => setIsOpen((current) => !current)}
        >
          {isOpen ? <LuChevronUp /> : <LuChevronDown />}
          Adjust
        </button>
      </div>

      {isOpen ? (
        <div className="plan-adjust-panel">
          <div className="adjust-control-grid">
            <label className="mini-field">
              <span>Move to</span>
              <select
                value={plan.day}
                onChange={(event) =>
                  onMove(plan.id, event.target.value as WeekDay)
                }
              >
                {weekDays.map((day) => (
                  <option key={day} value={day}>
                    {dayLabels[day]}
                  </option>
                ))}
              </select>
            </label>

            <label className="mini-field">
              <span>Type</span>
              <select
                value={plan.category}
                onChange={(event) =>
                  onCategoryChange(plan.id, event.target.value as PlanCategory)
                }
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {categoryLabels[category]}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="mini-field">
            <span>What actually happened?</span>
            <textarea
              placeholder="Quick note after the day changes..."
              value={plan.actualNotes ?? ""}
              onChange={(event) =>
                onActualNotesChange(plan.id, event.target.value)
              }
            />
          </label>

          <button
            className="remove-plan-button"
            type="button"
            onClick={() => onDelete(plan.id)}
          >
            Remove this plan
          </button>
        </div>
      ) : null}
    </article>
  );
}