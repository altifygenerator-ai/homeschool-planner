"use client";

import { useState } from "react";
import { LuPlus, LuRotateCcw, LuTag, LuX } from "react-icons/lu";
import {
  dayLabels,
  getCategoryLabel,
  timeBlocks,
  weekDays,
} from "@/data/demoPlans";
import { createId } from "@/lib/utils";
import type {
  CategoryDefinition,
  ChildProfile,
  PlanCategory,
  PlannerItem,
  TimeBlock,
  WeekDay,
} from "@/types/planner";

type AddPlanFormProps = {
  childProfiles: ChildProfile[];
  categories: CategoryDefinition[];
  weekStart: string;
  initialDays?: WeekDay[];
  titlePrefix?: string;
  onAddPlans: (plans: PlannerItem[]) => void;
  onAddCategory: (
    name: string,
  ) => CategoryDefinition | undefined | Promise<CategoryDefinition | undefined>;
  onCancel?: () => void;
};

export default function AddPlanForm({
  childProfiles,
  categories,
  weekStart,
  initialDays = ["Monday"],
  titlePrefix,
  onAddPlans,
  onAddCategory,
  onCancel,
}: AddPlanFormProps) {
  const firstCategory = categories[0]?.id ?? "reading";
  const defaultCategory = categories.some(
    (item) => item.id === "chores-routines",
  )
    ? "chores-routines"
    : firstCategory;
  const [title, setTitle] = useState("");
  const [selectedDays, setSelectedDays] = useState<WeekDay[]>(
    initialDays.length ? initialDays : ["Monday"],
  );
  const [category, setCategory] = useState<PlanCategory>(defaultCategory);
  const [customCategoryName, setCustomCategoryName] = useState("");
  const [timeBlock, setTimeBlock] = useState<TimeBlock>("Anytime");
  const [assignedTo, setAssignedTo] = useState("everyone");
  const [notes, setNotes] = useState("");
  const [resourceTitle, setResourceTitle] = useState("");
  const [resourceUrl, setResourceUrl] = useState("");

  function toggleDay(day: WeekDay) {
    setSelectedDays((current) => {
      if (current.includes(day)) {
        const next = current.filter((item) => item !== day);
        return next.length ? next : current;
      }

      return [...current, day];
    });
  }

  async function handleAddCategory() {
    const nextCategory = await onAddCategory(customCategoryName);
    if (!nextCategory) return;

    setCategory(nextCategory.id);
    setCustomCategoryName("");
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!title.trim() || !selectedDays.length) return;

    const newPlans: PlannerItem[] = selectedDays.map((day) => ({
      id: createId("plan"),
      title: title.trim(),
      day,
      category: safeCategory,
      timeBlock,
      assignedTo: safeAssignedTo,
      status: "planned",
      weekStart,
      notes: notes.trim(),
      resourceTitle: resourceTitle.trim(),
      resourceUrl: resourceUrl.trim(),
    }));

    onAddPlans(newPlans);

    setTitle("");
    setNotes("");
    setResourceTitle("");
    setResourceUrl("");
    setTimeBlock("Anytime");
    setAssignedTo("everyone");
    setSelectedDays(initialDays.length ? initialDays : ["Monday"]);
  }

  function loadExample() {
    setTitle("Feed animals / quick chore");
    setSelectedDays(
      initialDays.length
        ? initialDays
        : ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    );
    setCategory(defaultCategory);
    setTimeBlock("Morning");
    setAssignedTo("everyone");
    setNotes(
      "Type your own chore, lesson, routine, outing, or reminder. Pick one day or several days.",
    );
    setResourceTitle("");
    setResourceUrl("");
  }

  const safeCategory = categories.some((item) => item.id === category)
    ? category
    : firstCategory;

  const safeAssignedTo = childProfiles.some((child) => child.id === assignedTo)
    ? assignedTo
    : "everyone";

  const singleSelectedDay =
    selectedDays.length === 1 ? selectedDays[0] : undefined;

  return (
    <aside className="form-card add-plan-card add-plan-card-calendar">
      <div className="add-plan-card-header">
        <div>
          <p className="eyebrow">Add to calendar</p>
          <h2 className="section-title-sm">
            {titlePrefix ??
              (singleSelectedDay
                ? `Add something to ${dayLabels[singleSelectedDay]}.`
                : "Add something to the week.")}
          </h2>
          <p className="text-soft">
            Add a lesson, chore, routine, outing, appointment, or anything else
            that belongs in the homeschool week.
          </p>
        </div>

        <div className="add-plan-header-actions">
          <button
            className="mini-helper-button"
            type="button"
            onClick={loadExample}
          >
            <LuRotateCcw />
            Use example
          </button>

          {onCancel ? (
            <button
              className="mini-helper-button"
              type="button"
              onClick={onCancel}
            >
              <LuX />
              Close
            </button>
          ) : null}
        </div>
      </div>

      <form
        className="add-plan-form-grid add-plan-form-grid-calendar"
        onSubmit={handleSubmit}
      >
        <div className="field-group add-plan-title-field">
          <label className="field-label" htmlFor="title">
            What are you adding?
          </label>
          <input
            className="input"
            id="title"
            placeholder="Math lesson, feed chickens, co-op day, reading time..."
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />
        </div>

        <div className="field-group add-plan-days-field">
          <span className="field-label">Day or days</span>

          <div className="day-chip-row day-chip-row-seven">
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
            Start with one day, or add the same thing to several days at once.
          </p>
        </div>

        <div className="field-group add-plan-category-field">
          <label className="field-label" htmlFor="category">
            Type
          </label>
          <select
            className="select"
            id="category"
            value={safeCategory}
            onChange={(event) =>
              setCategory(event.target.value as PlanCategory)
            }
          >
            {categories.map((item) => (
              <option key={item.id} value={item.id}>
                {getCategoryLabel(item.id, categories)}
              </option>
            ))}
          </select>

          <div className="category-add-row">
            <input
              className="input"
              placeholder="Add spelling, animals, kitchen help..."
              value={customCategoryName}
              onChange={(event) => setCustomCategoryName(event.target.value)}
            />
            <button
              className="mini-icon-button"
              type="button"
              onClick={handleAddCategory}
              aria-label="Add custom category"
            >
              <LuTag />
            </button>
          </div>
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
            value={safeAssignedTo}
            onChange={(event) => setAssignedTo(event.target.value)}
          >
            {childProfiles.map((child) => (
              <option key={child.id} value={child.id}>
                {child.name}
              </option>
            ))}
          </select>
        </div>

        <div className="field-group add-plan-notes-field">
          <label className="field-label" htmlFor="notes">
            Notes, optional
          </label>
          <textarea
            className="textarea compact-textarea"
            id="notes"
            placeholder="Supplies, page numbers, quick reminders, or what to remember later..."
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
          />
        </div>

        <div className="field-group add-plan-resource-field">
          <label className="field-label" htmlFor="resourceTitle">
            Resource, optional
          </label>
          <input
            className="input"
            id="resourceTitle"
            placeholder="Video, worksheet, class link, PDF..."
            value={resourceTitle}
            onChange={(event) => setResourceTitle(event.target.value)}
          />

          <input
            className="input"
            id="resourceUrl"
            placeholder="Paste a link if there is one"
            value={resourceUrl}
            onChange={(event) => setResourceUrl(event.target.value)}
          />
        </div>

        <div className="add-plan-submit-row">
          <button className="btn btn-primary" type="submit">
            <LuPlus />
            Add item
          </button>
        </div>
      </form>
    </aside>
  );
}
