"use client";

import { useState } from "react";
import {
  LuBookOpen,
  LuCalculator,
  LuCheck,
  LuChevronDown,
  LuChevronUp,
  LuCopyPlus,
  LuExternalLink,
  LuGraduationCap,
  LuLandmark,
  LuLeaf,
  LuMap,
  LuMoveRight,
  LuPalette,
  LuSoup,
  LuX,
} from "react-icons/lu";
import {
  dayLabels,
  getCategoryLabel,
  weekDays,
} from "@/data/demoPlans";
import type {
  CategoryDefinition,
  ChildProfile,
  PlanCategory,
  PlannerItem,
  PlanStatus,
  WeekDay,
} from "@/types/planner";

type PlanCardProps = {
  plan: PlannerItem;
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

const categoryIcons: Record<string, typeof LuMoveRight> = {
  reading: LuBookOpen,
  math: LuCalculator,
  nature: LuLeaf,
  "life-skills": LuSoup,
  creative: LuPalette,
  outing: LuMap,
  science: LuGraduationCap,
  history: LuLandmark,
  "language-arts": LuBookOpen,
  other: LuMoveRight,
};

function getStatusLabel(status: PlanStatus) {
  if (status === "planned") return "Planned";
  if (status === "done") return "Done";
  if (status === "moved") return "Moved";
  return "Skipped";
}

function safeResourceHref(value?: string) {
  const trimmed = value?.trim();
  if (!trimmed) return "";

  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export default function PlanCard({
  plan,
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
}: PlanCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copyDay, setCopyDay] = useState<WeekDay>(plan.day);
  const Icon = categoryIcons[plan.category] ?? LuMoveRight;
  const assignedChild =
    childProfiles.find((child) => child.id === plan.assignedTo)?.name ?? "Everyone";
  const resourceHref = safeResourceHref(plan.resourceUrl);
  const resourceLabel = plan.resourceTitle?.trim() || "Open resource";

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
            <span>{getCategoryLabel(plan.category, categories)}</span>
            <span>{plan.timeBlock}</span>
          </div>
        </div>
      </div>

      <div className="assigned-pill">For {assignedChild}</div>

      {plan.notes ? <p className="plan-notes">{plan.notes}</p> : null}

      {resourceHref ? (
        <a
          className="resource-link-pill"
          href={resourceHref}
          target="_blank"
          rel="noreferrer"
        >
          <LuExternalLink />
          {resourceLabel}
        </a>
      ) : null}

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
          {canEditStructure ? (
            <div className="adjust-control-grid">
              <label className="mini-field">
                <span>Move this plan</span>
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
                    <option key={category.id} value={category.id}>
                      {getCategoryLabel(category.id, categories)}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          ) : null}

          {canEditStructure ? (
            <div className="copy-plan-row">
              <label className="mini-field">
                <span>Copy or add to another day</span>
                <select
                  value={copyDay}
                  onChange={(event) => setCopyDay(event.target.value as WeekDay)}
                >
                  {weekDays.map((day) => (
                    <option key={day} value={day}>
                      {dayLabels[day]}
                    </option>
                  ))}
                </select>
              </label>

              <button
                className="soft-action copy-plan-button"
                type="button"
                onClick={() => onCopy(plan.id, copyDay)}
              >
                <LuCopyPlus />
                Copy
              </button>
            </div>
          ) : null}

          {canEditStructure ? (
            <div className="resource-edit-grid">
              <label className="mini-field">
                <span>Resource label</span>
                <input
                  value={plan.resourceTitle ?? ""}
                  placeholder="Video, worksheet, class link..."
                  onChange={(event) =>
                    onResourceChange(plan.id, { resourceTitle: event.target.value })
                  }
                />
              </label>

              <label className="mini-field">
                <span>Resource link</span>
                <input
                  value={plan.resourceUrl ?? ""}
                  placeholder="https://..."
                  onChange={(event) =>
                    onResourceChange(plan.id, { resourceUrl: event.target.value })
                  }
                />
              </label>
            </div>
          ) : null}

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

          {canEditStructure ? (
            <button
              className="remove-plan-button"
              type="button"
              onClick={() => onDelete(plan.id)}
            >
              Remove this plan
            </button>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}
