"use client";

import { useMemo, useState } from "react";
import { LuX } from "react-icons/lu";
import { weekDays } from "@/data/demoPlans";
import { useModalDialog } from "@/hooks/useModalDialog";
import { createId } from "@/lib/utils";
import type { ChildProfile, PlannerItem, WeekDay, WeeklyRhythm } from "@/types/planner";

type WeeklyRhythmEditorProps = {
  weekStart: string;
  children: ChildProfile[];
  rhythms: WeeklyRhythm[];
  sourceItem?: PlannerItem | null;
  onSave: (rhythm: WeeklyRhythm) => void;
  onToggle: (rhythm: WeeklyRhythm) => void;
  onClose: () => void;
};

export default function WeeklyRhythmEditor({ weekStart, children, rhythms, sourceItem, onSave, onToggle, onClose }: WeeklyRhythmEditorProps) {
  const initialDays = useMemo(
    () => sourceItem?.day ? [sourceItem.day] : ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"] as WeekDay[],
    [sourceItem],
  );
  const [title, setTitle] = useState(sourceItem?.title ?? "");
  const [days, setDays] = useState<WeekDay[]>(initialDays);
  const [assignedTo, setAssignedTo] = useState(sourceItem?.assignedTo ?? "everyone");
  const [timeBlock, setTimeBlock] = useState(sourceItem?.timeBlock ?? "Anytime");
  const dialogRef = useModalDialog<HTMLElement>(onClose);

  function save() {
    if (!title.trim() || !days.length) return;
    onSave({
      id: createId("rhythm"),
      name: title.trim(),
      title: title.trim(),
      weekdays: days,
      assignedTo,
      category: sourceItem?.category ?? "other",
      timeBlock,
      notes: sourceItem?.notes ?? "",
      resourceTitle: sourceItem?.resourceTitle ?? "",
      resourceUrl: sourceItem?.resourceUrl ?? "",
      startWeek: weekStart,
      endWeek: null,
      active: true,
      createdAt: new Date().toISOString(),
    });
  }

  return (
    <div className="sw-dialog-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        ref={dialogRef}
        className="sw-dialog sw-rhythm-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="rhythm-title"
        tabIndex={-1}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button className="sw-dialog-close" type="button" onClick={onClose} aria-label="Close Weekly Rhythm">
          <LuX aria-hidden="true" />
        </button>
        <header>
          <p className="sw-kicker">Weekly rhythm</p>
          <h2 id="rhythm-title">Make this part of your normal week</h2>
          <p>SoftWeek will add it once on the selected days. Refreshing a week will not create duplicates.</p>
        </header>
        <label className="sw-field"><span>What repeats?</span><input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Reading" /></label>
        <fieldset className="sw-day-checkboxes">
          <legend>Days</legend>
          {weekDays.map((day) => (
            <label key={day} className={days.includes(day) ? "is-selected" : ""}>
              <input type="checkbox" checked={days.includes(day)} onChange={() => setDays((current) => current.includes(day) ? current.filter((item) => item !== day) : [...current, day])} />
              <span>{day.slice(0, 3)}</span>
            </label>
          ))}
        </fieldset>
        <div className="sw-two-fields">
          <label className="sw-field"><span>For</span><select value={assignedTo} onChange={(event) => setAssignedTo(event.target.value)}>{children.map((child) => <option key={child.id} value={child.id}>{child.name}</option>)}</select></label>
          <label className="sw-field"><span>Time</span><select value={timeBlock} onChange={(event) => setTimeBlock(event.target.value as WeeklyRhythm["timeBlock"])}><option>Anytime</option><option>Morning</option><option>Midday</option><option>Afternoon</option></select></label>
        </div>

        {rhythms.length ? (
          <div className="sw-existing-rhythms">
            <h3>Current rhythms</h3>
            {rhythms.map((rhythm) => (
              <div key={rhythm.id}>
                <span><strong>{rhythm.title}</strong><small>{rhythm.weekdays.map((day) => day.slice(0, 3)).join(", ")}</small></span>
                <button type="button" onClick={() => onToggle(rhythm)}>{rhythm.active ? "Pause" : "Resume"}</button>
              </div>
            ))}
          </div>
        ) : null}

        <footer className="sw-dialog-actions">
          <button type="button" className="sw-secondary-button" onClick={onClose}>Close</button>
          <button type="button" className="sw-primary-button" onClick={save} disabled={!title.trim() || !days.length}>Save rhythm</button>
        </footer>
      </section>
    </div>
  );
}
