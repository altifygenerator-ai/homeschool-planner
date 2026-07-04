"use client";

import { useState } from "react";
import { LuPlus, LuRotateCcw, LuTag } from "react-icons/lu";
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
  onAddPlans: (plans: PlannerItem[]) => void;
  onAddCategory: (name: string) => CategoryDefinition | undefined | Promise<CategoryDefinition | undefined>;
};

export default function AddPlanForm({
  childProfiles,
  categories,
  weekStart,
  onAddPlans,
  onAddCategory,
}: AddPlanFormProps) {
  const firstCategory = categories[0]?.id ?? "reading";
  const [title, setTitle] = useState("");
  const [selectedDays, setSelectedDays] = useState<WeekDay[]>(["Monday"]);
  const [category, setCategory] = useState<PlanCategory>(firstCategory);
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
    setSelectedDays(["Monday"]);
  }

  function loadExample() {
    setTitle("Swimming / movement time");
    setSelectedDays(["Tuesday", "Wednesday", "Thursday", "Friday", "Sunday"]);
    setCategory(categories.some((item) => item.id === "life-skills") ? "life-skills" : firstCategory);
    setTimeBlock("Afternoon");
    setAssignedTo("everyone");
    setNotes(
      "Add it once, pick the days that fit this week, and move it later if life changes."
    );
    setResourceTitle("Optional lesson link");
    setResourceUrl("");
  }

  const safeCategory = categories.some((item) => item.id === category)
    ? category
    : firstCategory;

  const safeAssignedTo = childProfiles.some((child) => child.id === assignedTo)
    ? assignedTo
    : "everyone";

  return (
    <aside className="form-card add-plan-card">
      <div className="add-plan-card-header">
        <div>
          <p className="eyebrow">Loose planning</p>
          <h2 className="section-title-sm">Add a plan to the week.</h2>
          <p className="text-soft">
            Pick any days in your 7-day week, assign it to a child or everyone,
            and keep it movable when real life changes the plan.
          </p>
        </div>

        <button
          className="mini-helper-button"
          type="button"
          onClick={loadExample}
        >
          <LuRotateCcw />
          Use example
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
            placeholder="Swimming, spelling practice, Sunday field trip..."
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />
        </div>

        <div className="field-group add-plan-days-field">
          <span className="field-label">Days</span>

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
            Choose one day, several weekdays, or weekend learning days too.
          </p>
        </div>

        <div className="field-group add-plan-category-field">
          <label className="field-label" htmlFor="category">
            Category
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
              placeholder="Add spelling, typing, social studies..."
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

          <p className="form-helper-text">
            Add a custom category when your subject needs a better name.
          </p>
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
            Gentle notes
          </label>
          <textarea
            className="textarea compact-textarea"
            id="notes"
            placeholder="Optional notes, supplies, a loose backup plan, or what you want to remember..."
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

          <p className="form-helper-text">
            Add a website, video, online class, PDF, or Google Drive link without turning SoftWeek into a full classroom system.
          </p>
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
