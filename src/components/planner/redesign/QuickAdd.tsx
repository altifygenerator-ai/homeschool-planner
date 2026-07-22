"use client";

import { useEffect, useRef, useState } from "react";
import { weekDays } from "@/data/demoPlans";
import type { ChildProfile, PlannerItem, WeekDay } from "@/types/planner";

type QuickAddProps = {
  children: ChildProfile[];
  defaultDay?: WeekDay | null;
  focusToken?: number;
  compact?: boolean;
  onAdd: (values: Pick<PlannerItem, "title" | "day" | "placement" | "assignedTo" | "timeBlock" | "category" | "notes" | "resourceTitle" | "resourceUrl">) => Promise<void> | void;
  onPaste?: (titles: string[], day: WeekDay | null, assignedTo: string) => Promise<void> | void;
};

export default function QuickAdd({
  children,
  defaultDay = null,
  focusToken = 0,
  compact = false,
  onAdd,
  onPaste,
}: QuickAddProps) {
  const [title, setTitle] = useState("");
  const [day, setDay] = useState<WeekDay | null>(defaultDay);
  const [assignedTo, setAssignedTo] = useState("everyone");
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [notes, setNotes] = useState("");
  const [resourceTitle, setResourceTitle] = useState("");
  const [resourceUrl, setResourceUrl] = useState("");
  const [pasteOpen, setPasteOpen] = useState(false);
  const [pasteValue, setPasteValue] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setDay(defaultDay);
  }, [defaultDay]);

  useEffect(() => {
    if (focusToken > 0) inputRef.current?.focus();
  }, [focusToken]);

  async function submit() {
    const cleanTitle = title.trim();
    if (!cleanTitle || submitting) return;
    setSubmitting(true);
    setSubmitError("");
    try {
      await onAdd({
        title: cleanTitle,
        day,
        placement: day ? "day" : "week",
        assignedTo,
        timeBlock: "Anytime",
        category: "other",
        notes: notes.trim(),
        resourceTitle: resourceTitle.trim(),
        resourceUrl: resourceUrl.trim(),
      });
      setTitle("");
      setNotes("");
      setResourceTitle("");
      setResourceUrl("");
      setDetailsOpen(false);
      inputRef.current?.focus();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "That item could not be saved. Your entry is still here.");
    } finally {
      setSubmitting(false);
    }
  }

  async function submitPaste() {
    const titles = pasteValue
      .split(/\r?\n/)
      .map((line) => line.trim().replace(/^[-*•]\s*/, ""))
      .filter(Boolean);
    if (!titles.length || !onPaste || submitting) return;
    setSubmitting(true);
    setSubmitError("");
    try {
      await onPaste(titles, day, assignedTo);
      setPasteValue("");
      setPasteOpen(false);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "The list could not be saved. Your pasted items are still here.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={`sw-quick-add ${compact ? "is-compact" : ""}`}>
      <div className="sw-quick-add-line">
        <input
          ref={inputRef}
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              void submit();
            }
          }}
          placeholder={day ? `Add something for ${day}` : "What needs to happen this week?"}
          aria-label={day ? `Add an item for ${day}` : "Add an item to This Week"}
        />
        <button type="button" className="sw-primary-button" onClick={() => void submit()} disabled={!title.trim() || submitting}>
          Add
        </button>
      </div>

      {submitError ? <p className="sw-quick-add-error" role="alert">{submitError}</p> : null}

      <div className="sw-quick-add-options">
        <label>
          <span>Place</span>
          <select value={day ?? "week"} onChange={(event) => setDay(event.target.value === "week" ? null : event.target.value as WeekDay)}>
            <option value="week">This Week</option>
            {weekDays.map((item) => <option value={item} key={item}>{item}</option>)}
          </select>
        </label>
        <label>
          <span>For</span>
          <select value={assignedTo} onChange={(event) => setAssignedTo(event.target.value)}>
            {children.map((child) => <option value={child.id} key={child.id}>{child.name}</option>)}
          </select>
        </label>
        <button type="button" className="sw-text-button" onClick={() => setDetailsOpen((value) => !value)}>
          {detailsOpen ? "Hide details" : "Add details"}
        </button>
        {onPaste ? (
          <button type="button" className="sw-text-button" onClick={() => setPasteOpen((value) => !value)}>
            Paste a list
          </button>
        ) : null}
      </div>

      {detailsOpen ? (
        <div className="sw-quick-details">
          <label>
            <span>Notes</span>
            <textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Page number, supplies, or a reminder" />
          </label>
          <label>
            <span>Resource name</span>
            <input value={resourceTitle} onChange={(event) => setResourceTitle(event.target.value)} placeholder="Worksheet, video, class link" />
          </label>
          <label>
            <span>Resource link</span>
            <input value={resourceUrl} onChange={(event) => setResourceUrl(event.target.value)} placeholder="https://" inputMode="url" />
          </label>
        </div>
      ) : null}

      {pasteOpen ? (
        <div className="sw-paste-panel">
          <label>
            <span>One item per line</span>
            <textarea
              value={pasteValue}
              onChange={(event) => setPasteValue(event.target.value)}
              placeholder={"Math lesson 14\nRead chapter 3\nNature walk\nLibrary"}
              rows={6}
            />
          </label>
          <div className="sw-dialog-actions">
            <button type="button" className="sw-secondary-button" onClick={() => setPasteOpen(false)}>Cancel</button>
            <button type="button" className="sw-primary-button" onClick={() => void submitPaste()} disabled={!pasteValue.trim() || submitting}>
              Add {pasteValue.split(/\r?\n/).filter((line) => line.trim()).length || "items"}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
