"use client";

import { useState } from "react";
import { LuX } from "react-icons/lu";
import { useModalDialog } from "@/hooks/useModalDialog";
import { createId } from "@/lib/utils";
import { nextLessonItems } from "@/lib/plannerLogic";
import type { ChildProfile, LessonStack } from "@/types/planner";

type LessonStackManagerProps = {
  stacks: LessonStack[];
  children: ChildProfile[];
  onSave: (stack: LessonStack) => void;
  onAddLessons: (stack: LessonStack, count: number) => void;
  onClose: () => void;
};

export default function LessonStackManager({ stacks, children, onSave, onAddLessons, onClose }: LessonStackManagerProps) {
  const [name, setName] = useState("");
  const [assignedTo, setAssignedTo] = useState("everyone");
  const [itemsText, setItemsText] = useState("");
  const dialogRef = useModalDialog<HTMLElement>(onClose);

  function createStack() {
    const lines = itemsText.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    if (!name.trim() || !lines.length) return;
    onSave({
      id: createId("stack"),
      name: name.trim(),
      assignedTo,
      category: "other",
      active: true,
      createdAt: new Date().toISOString(),
      items: lines.map((title, position) => ({ id: createId("lesson"), title, position, status: "queued" })),
    });
    setName("");
    setItemsText("");
  }

  return (
    <div className="sw-dialog-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        ref={dialogRef}
        className="sw-dialog sw-stack-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="stack-title"
        tabIndex={-1}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button className="sw-dialog-close" type="button" onClick={onClose} aria-label="Close Lesson Stacks">
          <LuX aria-hidden="true" />
        </button>
        <header>
          <p className="sw-kicker">Lesson stacks</p>
          <h2 id="stack-title">Keep lessons in order without dating everything</h2>
          <p>Add only the next lesson or a small batch when the week is ready for it.</p>
        </header>

        <div className="sw-stack-create">
          <label className="sw-field"><span>Stack name</span><input value={name} onChange={(event) => setName(event.target.value)} placeholder="Math" /></label>
          <label className="sw-field"><span>For</span><select value={assignedTo} onChange={(event) => setAssignedTo(event.target.value)}>{children.map((child) => <option value={child.id} key={child.id}>{child.name}</option>)}</select></label>
          <label className="sw-field sw-full-field"><span>Lessons, one per line</span><textarea value={itemsText} onChange={(event) => setItemsText(event.target.value)} rows={6} placeholder={"Lesson 14\nLesson 15\nReview\nLesson 16\nQuiz"} /></label>
          <button type="button" className="sw-primary-button" onClick={createStack} disabled={!name.trim() || !itemsText.trim()}>Create stack</button>
        </div>

        <div className="sw-stack-list">
          {stacks.map((stack) => {
            const next = nextLessonItems(stack.items, 1)[0];
            const complete = stack.items.filter((item) => item.status === "done").length;
            return (
              <article key={stack.id}>
                <div><strong>{stack.name}</strong><span>{complete} of {stack.items.length} completed</span></div>
                <p>{next ? `Next: ${next.title}` : "No queued lessons left."}</p>
                <div className="sw-item-action-row">
                  <button type="button" disabled={!next} onClick={() => onAddLessons(stack, 1)}>Add next</button>
                  <button type="button" disabled={!next} onClick={() => onAddLessons(stack, 3)}>Add next 3</button>
                  <button type="button" disabled={!next} onClick={() => onAddLessons(stack, 5)}>Add next 5</button>
                </div>
              </article>
            );
          })}
          {!stacks.length ? <div className="sw-empty-line">No lesson stacks yet.</div> : null}
        </div>

        <footer className="sw-dialog-actions"><button type="button" className="sw-secondary-button" onClick={onClose}>Close</button></footer>
      </section>
    </div>
  );
}
