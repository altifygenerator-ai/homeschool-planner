"use client";

import { useMemo, useState } from "react";
import { LuX } from "react-icons/lu";
import { useModalDialog } from "@/hooks/useModalDialog";
import { buildRecoveryChanges, type RecoveryMode } from "@/lib/plannerLogic";
import type { PlannerItem, WeekDay } from "@/types/planner";

type LifeHappenedDialogProps = {
  plans: PlannerItem[];
  weekStart: string;
  selectedDay?: WeekDay;
  onClose: () => void;
  onApply: (mode: RecoveryMode, changes: ReturnType<typeof buildRecoveryChanges>, dayKind?: string) => void;
};

const options: Array<{ value: RecoveryMode; title: string; detail: string }> = [
  { value: "tomorrow", title: "Move it to tomorrow", detail: "Keep the unfinished work together on the next day." },
  { value: "spread", title: "Spread it out", detail: "Distribute unfinished work across the remaining days." },
  { value: "this-week", title: "Put it back in This Week", detail: "Keep it visible without choosing another day yet." },
  { value: "next-week", title: "Move it to next week", detail: "Carry unfinished work into next week’s holding area." },
];

export default function LifeHappenedDialog({ plans, weekStart, selectedDay, onClose, onApply }: LifeHappenedDialogProps) {
  const [mode, setMode] = useState<RecoveryMode>("this-week");
  const [dayKind, setDayKind] = useState("");
  const dialogRef = useModalDialog<HTMLElement>(onClose);
  const changes = useMemo(
    () => buildRecoveryChanges({ plans, weekStart, selectedDay, mode }),
    [plans, weekStart, selectedDay, mode],
  );
  const items = changes
    .map((change) => plans.find((plan) => plan.id === change.id))
    .filter(Boolean) as PlannerItem[];

  return (
    <div className="sw-dialog-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        ref={dialogRef}
        className="sw-dialog sw-life-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="life-happened-title"
        tabIndex={-1}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button className="sw-dialog-close" type="button" onClick={onClose} aria-label="Close Life Happened">
          <LuX aria-hidden="true" />
        </button>
        <header>
          <p className="sw-kicker">Life happened</p>
          <h2 id="life-happened-title">Fix the plan in one step</h2>
          <p>{items.length ? `${items.length} unfinished ${items.length === 1 ? "item" : "items"} can be moved together.` : "There is no unfinished work in this selection."}</p>
        </header>

        <div className="sw-recovery-options">
          {options.map((option) => (
            <label key={option.value} className={mode === option.value ? "is-selected" : ""}>
              <input type="radio" name="recovery" value={option.value} checked={mode === option.value} onChange={() => setMode(option.value)} />
              <span><strong>{option.title}</strong><small>{option.detail}</small></span>
            </label>
          ))}
        </div>

        <label className="sw-day-kind-field">
          <span>Optional note for the day</span>
          <select value={dayKind} onChange={(event) => setDayKind(event.target.value)}>
            <option value="">No day label</option>
            <option value="sick">Sick day</option>
            <option value="field-trip">Field-trip day</option>
            <option value="family">Family day</option>
            <option value="rest">Rest day</option>
          </select>
        </label>

        <div className="sw-preview-box">
          <h3>Preview</h3>
          {items.length ? (
            <ul>
              {items.map((item) => {
                const change = changes.find((entry) => entry.id === item.id)!;
                const destination = change.placement === "week"
                  ? change.toWeekStart === weekStart ? "This Week" : "next week’s This Week"
                  : change.toDay;
                return <li key={item.id}><span>{item.title}</span><strong>→ {destination}</strong></li>;
              })}
            </ul>
          ) : <p>Finished work stays where it is. Nothing will change.</p>}
        </div>

        <footer className="sw-dialog-actions">
          <button type="button" className="sw-secondary-button" onClick={onClose}>Cancel</button>
          <button type="button" className="sw-primary-button" disabled={!changes.length} onClick={() => onApply(mode, changes, dayKind)}>Apply changes</button>
        </footer>
      </section>
    </div>
  );
}
