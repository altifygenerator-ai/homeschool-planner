"use client";

import { useState } from "react";
import { LuPlus, LuRotateCcw } from "react-icons/lu";
import { categories, timeBlocks, weekDays } from "@/data/demoPlans";
import { createId } from "@/lib/utils";
import type {
  PlanCategory,
  PlannerItem,
  TimeBlock,
  WeekDay,
} from "@/types/planner";

type AddPlanFormProps = {
  onAddPlan: (plan: PlannerItem) => void;
};

export default function AddPlanForm({ onAddPlan }: AddPlanFormProps) {
  const [title, setTitle] = useState("Read outside for 20 minutes");
  const [day, setDay] = useState<WeekDay>("Thursday");
  const [category, setCategory] = useState<PlanCategory>("reading");
  const [timeBlock, setTimeBlock] = useState<TimeBlock>("Anytime");
  const [notes, setNotes] = useState(
    "Keep it relaxed. If everyone is tired, move it to tomorrow."
  );

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!title.trim()) return;

    onAddPlan({
      id: createId("plan"),
      title: title.trim(),
      day,
      category,
      timeBlock,
      status: "planned",
      notes: notes.trim(),
    });

    setTitle("");
    setNotes("");
    setTimeBlock("Anytime");
  }

  function loadExample() {
    setTitle("Library trip");
    setDay("Friday");
    setCategory("outing");
    setTimeBlock("Afternoon");
    setNotes("Pick books, return last week’s stack, maybe count it as reading time.");
  }

  return (
    <aside className="form-card">
      <div className="stack-md">
        <div>
          <p className="eyebrow">Loose planning</p>
          <h2 className="section-title-sm">Add a plan without locking in the week.</h2>
          <p className="text-soft">
            Put something on the week, then move it, mark it done, skip it, or
            add what actually happened later.
          </p>
        </div>

        <form className="form-grid" onSubmit={handleSubmit}>
          <div className="field-group">
            <label className="field-label" htmlFor="title">
              Plan title
            </label>
            <input
              className="input"
              id="title"
              placeholder="Nature walk, math review, library trip..."
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />
          </div>

          <div className="planner-form-row">
            <div className="field-group">
              <label className="field-label" htmlFor="day">
                Day
              </label>
              <select
                className="select"
                id="day"
                value={day}
                onChange={(event) => setDay(event.target.value as WeekDay)}
              >
                {weekDays.map((item) => (
                  <option key={item}>{item}</option>
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
                onChange={(event) =>
                  setTimeBlock(event.target.value as TimeBlock)
                }
              >
                {timeBlocks.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </div>
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
                  {item.replace("-", " ")}
                </option>
              ))}
            </select>
          </div>

          <div className="field-group">
            <label className="field-label" htmlFor="notes">
              Gentle notes
            </label>
            <textarea
              className="textarea"
              id="notes"
              placeholder="Optional notes, reminders, supplies, or a loose backup plan..."
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
            />
          </div>

          <div className="btn-row">
            <button className="btn btn-primary" type="submit">
              <LuPlus />
              Add to week
            </button>

            <button
              className="btn btn-secondary"
              type="button"
              onClick={loadExample}
            >
              <LuRotateCcw />
              Load example
            </button>
          </div>
        </form>
      </div>
    </aside>
  );
}