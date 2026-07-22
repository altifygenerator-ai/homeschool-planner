"use client";

import { useMemo, useState } from "react";
import { LuX } from "react-icons/lu";
import { useModalDialog } from "@/hooks/useModalDialog";
import type { PlannerItem } from "@/types/planner";

type WeekCloseoutProps = {
  plans: PlannerItem[];
  onClose: () => void;
  onComplete: (unfinishedIds: string[], familyNote: string) => void;
};

export default function WeekCloseout({ plans, onClose, onComplete }: WeekCloseoutProps) {
  const unfinished = useMemo(() => plans.filter((item) => !["done", "skipped"].includes(item.status)), [plans]);
  const [selected, setSelected] = useState<string[]>(unfinished.map((item) => item.id));
  const [familyNote, setFamilyNote] = useState("");
  const done = plans.filter((item) => item.status === "done");
  const skipped = plans.filter((item) => item.status === "skipped");
  const dialogRef = useModalDialog<HTMLElement>(onClose);

  return (
    <div className="sw-dialog-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        ref={dialogRef}
        className="sw-dialog sw-closeout-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="closeout-title"
        tabIndex={-1}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button className="sw-dialog-close" type="button" onClick={onClose} aria-label="Close week closeout">
          <LuX aria-hidden="true" />
        </button>
        <header>
          <p className="sw-kicker">Wrap up this week</p>
          <h2 id="closeout-title">Keep the record and clear the path forward</h2>
          <p>{done.length} completed · {skipped.length} skipped · {unfinished.length} unfinished</p>
        </header>

        {unfinished.length ? (
          <div className="sw-closeout-items">
            <h3>Carry into next week’s This Week area</h3>
            {unfinished.map((item) => (
              <label key={item.id}>
                <input type="checkbox" checked={selected.includes(item.id)} onChange={() => setSelected((current) => current.includes(item.id) ? current.filter((id) => id !== item.id) : [...current, item.id])} />
                <span>{item.title}</span>
              </label>
            ))}
          </div>
        ) : <p className="sw-empty-line">Everything is already completed or skipped.</p>}

        <label className="sw-field"><span>Family note, optional</span><textarea value={familyNote} onChange={(event) => setFamilyNote(event.target.value)} rows={3} placeholder="A short note about the week" /></label>

        <footer className="sw-dialog-actions">
          <button type="button" className="sw-secondary-button" onClick={onClose}>Cancel</button>
          <button type="button" className="sw-primary-button" onClick={() => onComplete(selected, familyNote)}>Close week and set up next</button>
        </footer>
      </section>
    </div>
  );
}
