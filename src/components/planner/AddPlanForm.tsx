"use client";

import { useState } from "react";
import { LuPlus, LuRotateCcw } from "react-icons/lu";
import {
  categories,
  categoryLabels,
  dayLabels,
  timeBlocks,
  weekDays,
} from "@/data/demoPlans";
import { createId } from "@/lib/utils";
import type {
  ChildProfile,
  PlanCategory,
  PlannerItem,
  TimeBlock,
  WeekDay,
} from "@/types/planner";

type AddPlanFormProps = {
  children: ChildProfile[];
  onAddPlans: (plans: PlannerItem[]) => void;
};

export default function AddPlanForm({
  children,
  onAddPlans,
}: AddPlanFormProps) {
  const [title, setTitle] = useState("Read outside for 20 minutes");
  const [selectedDays, setSelectedDays] = useState<WeekDay[]>(["Thursday"]);
  const [category, setCategory] = useState<PlanCategory>("reading");
  const [timeBlock, setTimeBlock] = useState<TimeBlock>("Anytime");
  const [assignedTo, setAssignedTo] = useState("everyone");
  const [notes, setNotes] = useState(
    "Keep it relaxed. If everyone is tired, move it to tomorrow."
  );

  function toggleDay(day: WeekDay) {
    setSelectedDays((current) => {
      if (current.includes(day)) {
        const next = current.filter((item) => item !== day);
        return next.length ? next : current;
      }

      return [...current, day];
    });
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!title.trim() || !selectedDays.length) return;

    const newPlans: PlannerItem[] = selectedDays.map((day) => ({
      id: createId("plan"),
      title: title.trim(),
      day,
      category,
      timeBlock,
      assignedTo,
      status: "planned",
      notes: notes.trim(),
    }));

    onAddPlans(newPlans);

    setTitle("");
    setNotes("");
    setTimeBlock("Anytime");
    setAssignedTo("everyone");
    setSelectedDays(["Monday"]);
  }

  function loadExample() {
    setTitle("Swimming / movement time");
    setSelectedDays(["Monday", "Wednesday", "Friday"]);
    setCategory("life-skills");
    setTimeBlock("Afternoon");
    setAssignedTo("everyone");
    setNotes(
      "Add it once and place it on multiple days instead of re-entering it each time."
    );
  }

  return (
    <aside className="form-card add-plan-card">
      <div className="add-plan-card-header">
        <div>
          <p className="eyebrow">Loose planning</p>
          <h2 className="section-title-sm">Add a plan to the week.</h2>
          <p className="text-soft">
            Choose one day or several, assign it to a child or everyone, and
            keep it movable when the week changes.
          </p>
        </div>

        <button
          className="mini-helper-button"
          type="button"
          onClick={loadExample}
        >
          <LuRotateCcw />
          Multi-day example
        </button>
      </div>

      <form className="add-plan-form-grid" onSubmit={handleSubmit}>
        <div className="field-group add-plan-title-field">
          <label className="field-label" htmlFor="title">
            Plan title
          </label>
          <input
            className="input"
            id="title"
            placeholder="Swimming, math review, library trip..."
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />
        </div>

        <div className="field-group add-plan-days-field">
          <span className="field-label">Days</span>

          <div className="day-chip-row">
            {weekDays.map((day) => {
              const isActive = selectedDays.includes(day);

              return (
                <button
                  className={`day-chip ${isActive ? "active" : ""}`}
                  type="button"
                  key={day}
                  onClick={() => toggleDay(day)}
                  aria-pressed={isActive}
                >
                  {dayLabels[day]}
                </button>
              );
            })}
          </div>

          <p className="form-helper-text">
            Pick one day or several for repeated activities.
          </p>
        </div>

        <div className="field-group">
          <label className="field-label" htmlFor="category">
            Category
          </label>
          <select
            className="select"
            id="category"
            value={category}
            onChange={(event) =>
              setCategory(event.target.value as PlanCategory)
            }
          >
            {categories.map((item) => (
              <option key={item} value={item}>
                {categoryLabels[item]}
              </option>
            ))}
          </select>
        </div>

        <div className="field-group">
          <label className="field-label" htmlFor="timeBlock">
            Time feel
          </label>
          <select
            className="select"
            id="timeBlock"
            value={timeBlock}
            onChange={(event) => setTimeBlock(event.target.value as TimeBlock)}
          >
            {timeBlocks.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </div>

        <div className="field-group">
          <label className="field-label" htmlFor="assignedTo">
            For
          </label>
          <select
            className="select"
            id="assignedTo"
            value={assignedTo}
            onChange={(event) => setAssignedTo(event.target.value)}
          >
            {children.map((child) => (
              <option key={child.id} value={child.id}>
                {child.name}
              </option>
            ))}
          </select>
        </div>

        <div className="field-group add-plan-notes-field">
          <label className="field-label" htmlFor="notes">
            Gentle notes
          </label>
          <textarea
            className="textarea compact-textarea"
            id="notes"
            placeholder="Optional notes, supplies, or a loose backup plan..."
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
          />
        </div>

        <div className="add-plan-submit-row">
          <button className="btn btn-primary" type="submit">
            <LuPlus />
            Add to week
          </button>
        </div>
      </form>
    </aside>
  );
}