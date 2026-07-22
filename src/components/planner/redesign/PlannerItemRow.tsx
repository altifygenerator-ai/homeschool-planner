"use client";

import { useEffect, useState } from "react";
import { dayLabels, weekDays } from "@/data/demoPlans";
import type { ChildProfile, PlannerItem, WeekDay } from "@/types/planner";

type PlannerItemRowProps = {
  item: PlannerItem;
  children: ChildProfile[];
  canEdit?: boolean;
  canMove?: boolean;
  onComplete: (item: PlannerItem) => void;
  onRestore: (item: PlannerItem) => void;
  onMove: (item: PlannerItem, day: WeekDay | null) => void;
  onSkip: (item: PlannerItem) => void;
  onDelete: (item: PlannerItem) => void;
  onNote: (item: PlannerItem, note: string) => void;
  onMakeRhythm?: (item: PlannerItem) => void;
};

export default function PlannerItemRow({
  item,
  children,
  canEdit = true,
  canMove = canEdit,
  onComplete,
  onRestore,
  onMove,
  onSkip,
  onDelete,
  onNote,
  onMakeRhythm,
}: PlannerItemRowProps) {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState(item.actualNotes ?? "");

  useEffect(() => {
    setNote(item.actualNotes ?? "");
  }, [item.actualNotes]);

  const childName = children.find((child) => child.id === item.assignedTo)?.name ?? "Everyone";
  const done = item.status === "done";
  const skipped = item.status === "skipped";

  return (
    <article className={`sw-item-row is-${item.status} ${item.syncState === "error" ? "has-error" : ""}`}>
      <button
        className="sw-check-button"
        type="button"
        aria-label={done ? `Mark ${item.title} not done` : `Mark ${item.title} done`}
        aria-pressed={done}
        onClick={() => done ? onRestore(item) : onComplete(item)}
      >
        {done ? "✓" : ""}
      </button>

      <div className="sw-item-main">
        <button type="button" className="sw-item-title-button" onClick={() => setOpen((value) => !value)} aria-expanded={open}>
          <strong>{item.title}</strong>
          <span>{childName}{item.timeBlock !== "Anytime" ? ` · ${item.timeBlock}` : ""}</span>
        </button>
        {item.resourceUrl ? (
          <a className="sw-resource-link" href={item.resourceUrl} target="_blank" rel="noreferrer" onClick={(event) => event.stopPropagation()}>
            {item.resourceTitle || "Open resource"}
          </a>
        ) : null}
      </div>

      <button type="button" className="sw-more-button" onClick={() => setOpen((value) => !value)} aria-label={`More actions for ${item.title}`} aria-expanded={open}>
        •••
      </button>

      {open ? (
        <div className="sw-item-details">
          {item.notes ? <p className="sw-item-notes">{item.notes}</p> : null}
          <div className="sw-item-action-row">
            {!done && !skipped ? <button type="button" onClick={() => onSkip(item)}>Skip</button> : null}
            {skipped ? <button type="button" onClick={() => onRestore(item)}>Restore</button> : null}
            {canMove ? (
              <label>
                <span>Move</span>
                <select value={item.placement === "week" ? "week" : item.day ?? "week"} onChange={(event) => onMove(item, event.target.value === "week" ? null : event.target.value as WeekDay)}>
                  <option value="week">This Week</option>
                  {weekDays.map((day) => <option value={day} key={day}>{dayLabels[day]}</option>)}
                </select>
              </label>
            ) : null}
            {canEdit && onMakeRhythm ? <button type="button" onClick={() => onMakeRhythm(item)}>Make this part of our normal week</button> : null}
            {canEdit ? <button type="button" className="is-danger" onClick={() => onDelete(item)}>Delete</button> : null}
          </div>

          {done ? (
            <div className="sw-completion-note">
              <label>
                <span>Quick completion note, optional</span>
                <textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="What actually happened?" rows={2} />
              </label>
              <button type="button" className="sw-secondary-button" onClick={() => onNote(item, note)}>Save note</button>
            </div>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}
