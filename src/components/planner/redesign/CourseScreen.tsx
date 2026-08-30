"use client";

import { useMemo, useState } from "react";
import { LuBookOpen, LuChevronDown, LuPause, LuPlay, LuPlus } from "react-icons/lu";
import { weekDays } from "@/data/demoPlans";
import { courseRhythmId } from "@/lib/plannerLogic";
import { createId } from "@/lib/utils";
import type { ChildProfile, LessonStack, WeekDay, WeeklyRhythm } from "@/types/planner";

type CourseScreenProps = {
  stacks: LessonStack[];
  children: ChildProfile[];
  rhythms: WeeklyRhythm[];
  canEdit: boolean;
  onSaveCourse: (stack: LessonStack, weekdays: WeekDay[]) => Promise<void> | void;
  onUpdateDays: (stack: LessonStack, weekdays: WeekDay[]) => Promise<void> | void;
  onToggleCourse: (stack: LessonStack) => Promise<void> | void;
  onAddNext: (stack: LessonStack) => Promise<void> | void;
};

function expandLessons(value: string) {
  const clean = value.trim();
  if (!clean) return [];

  const rangeMatch = clean.match(/^(?:(lessons?|chapters?)\s*)?(\d+)\s*[-–—]\s*(\d+)$/i);
  if (rangeMatch) {
    const start = Number(rangeMatch[2]);
    const end = Number(rangeMatch[3]);
    if (Number.isFinite(start) && Number.isFinite(end) && end >= start && end - start <= 399) {
      const rawLabel = rangeMatch[1]?.toLowerCase() ?? "lesson";
      const label = rawLabel.startsWith("chapter") ? "Chapter" : "Lesson";
      return Array.from({ length: end - start + 1 }, (_, index) => `${label} ${start + index}`);
    }
  }

  const countMatch = clean.match(/^(\d+)\s+(lessons?|chapters?)$/i);
  if (countMatch) {
    const count = Math.min(Number(countMatch[1]), 400);
    const label = countMatch[2].toLowerCase().startsWith("chapter") ? "Chapter" : "Lesson";
    if (count > 0) return Array.from({ length: count }, (_, index) => `${label} ${index + 1}`);
  }

  return clean
    .split(/\r?\n/)
    .map((line) => line.trim().replace(/^[-*•]\s*/, ""))
    .filter(Boolean)
    .slice(0, 400);
}

function nextCourseItem(stack: LessonStack) {
  return [...stack.items]
    .sort((a, b) => a.position - b.position)
    .find((item) => item.status === "planned" || item.status === "queued");
}

function childName(children: ChildProfile[], id: string) {
  return children.find((child) => child.id === id)?.name ?? "Everyone";
}

export default function CourseScreen({
  stacks,
  children,
  rhythms,
  canEdit,
  onSaveCourse,
  onUpdateDays,
  onToggleCourse,
  onAddNext,
}: CourseScreenProps) {
  const [createOpen, setCreateOpen] = useState(!stacks.length);
  const [name, setName] = useState("");
  const [assignedTo, setAssignedTo] = useState("everyone");
  const [lessonInput, setLessonInput] = useState("");
  const [days, setDays] = useState<WeekDay[]>(["Monday", "Tuesday", "Wednesday", "Thursday"]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const parsedLessons = useMemo(() => expandLessons(lessonInput), [lessonInput]);
  const activeStacks = stacks.filter((stack) => stack.active);
  const pausedStacks = stacks.filter((stack) => !stack.active);

  async function createCourse() {
    if (!name.trim() || !parsedLessons.length || !days.length || saving) return;
    setSaving(true);
    setMessage("");
    const stack: LessonStack = {
      id: createId("course"),
      name: name.trim(),
      assignedTo,
      category: "other",
      active: true,
      createdAt: new Date().toISOString(),
      items: parsedLessons.map((title, position) => ({
        id: createId("lesson"),
        title,
        position,
        status: "queued",
      })),
    };

    try {
      await onSaveCourse(stack, days);
      setName("");
      setLessonInput("");
      setAssignedTo("everyone");
      setDays(["Monday", "Tuesday", "Wednesday", "Thursday"]);
      setCreateOpen(false);
      setMessage(`${stack.name} is ready. SoftWeek will surface one next lesson on its normal days.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "That course could not be saved.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="sw-screen sw-course-screen">
      <header className="sw-screen-header sw-course-header">
        <div>
          <p className="sw-kicker">Courses</p>
          <h1>Load it once. Keep moving.</h1>
          <p>
            Add the lessons in order and choose the days you normally do the subject. SoftWeek keeps one next lesson ready instead of dating the whole year.
          </p>
        </div>
        {canEdit ? (
          <button type="button" className="sw-primary-button" onClick={() => setCreateOpen((value) => !value)}>
            <LuPlus aria-hidden="true" /> {createOpen ? "Close" : "Add course"}
          </button>
        ) : null}
      </header>

      {message ? <div className="sw-course-message" role="status">{message}</div> : null}

      {createOpen && canEdit ? (
        <section className="sw-course-create-card">
          <div className="sw-course-create-copy">
            <p className="sw-kicker">Set up a course</p>
            <h2>Paste the sequence, not the calendar.</h2>
            <p>
              You can paste one lesson per line, type <strong>Lessons 1-120</strong>, or type <strong>120 lessons</strong>. SoftWeek will keep the order for you.
            </p>
          </div>

          <div className="sw-course-form-grid">
            <label className="sw-field">
              <span>Course or subject</span>
              <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Math · Teaching Textbooks 6" />
            </label>
            <label className="sw-field">
              <span>For</span>
              <select value={assignedTo} onChange={(event) => setAssignedTo(event.target.value)}>
                {children.map((child) => <option value={child.id} key={child.id}>{child.name}</option>)}
              </select>
            </label>
          </div>

          <label className="sw-field sw-course-lessons-field">
            <span>Lessons in order</span>
            <textarea
              value={lessonInput}
              onChange={(event) => setLessonInput(event.target.value)}
              rows={7}
              placeholder={"Lessons 1-120\n\nor paste:\nLesson 1 - Whole numbers\nLesson 2 - Addition\nLesson 3 - Subtraction"}
            />
          </label>

          <fieldset className="sw-course-days">
            <legend>Normal days</legend>
            {weekDays.slice(0, 7).map((day) => (
              <label key={day} className={days.includes(day) ? "is-selected" : ""}>
                <input
                  type="checkbox"
                  checked={days.includes(day)}
                  onChange={() => setDays((current) => current.includes(day) ? current.filter((item) => item !== day) : [...current, day])}
                />
                <span>{day.slice(0, 3)}</span>
              </label>
            ))}
          </fieldset>

          <div className="sw-course-create-footer">
            <span>{parsedLessons.length ? `${parsedLessons.length} lessons ready to load` : "Add at least one lesson"}</span>
            <button type="button" className="sw-primary-button" onClick={() => void createCourse()} disabled={!name.trim() || !parsedLessons.length || !days.length || saving}>
              {saving ? "Saving…" : "Create course"}
            </button>
          </div>
        </section>
      ) : null}

      {!stacks.length && !createOpen ? (
        <section className="sw-course-empty">
          <LuBookOpen aria-hidden="true" />
          <div>
            <h2>Your planner gets easier when SoftWeek knows what comes next.</h2>
            <p>Create one course, paste its lesson sequence, and choose the days you normally use it.</p>
            {canEdit ? <button type="button" className="sw-primary-button" onClick={() => setCreateOpen(true)}>Create your first course</button> : null}
          </div>
        </section>
      ) : null}

      {activeStacks.length ? (
        <div className="sw-course-grid">
          {activeStacks.map((stack) => {
            const completed = stack.items.filter((item) => item.status === "done").length;
            const skipped = stack.items.filter((item) => item.status === "skipped").length;
            const total = stack.items.length;
            const finished = completed + skipped;
            const progress = total ? Math.min(100, Math.round((finished / total) * 100)) : 0;
            const next = nextCourseItem(stack);
            const rhythm = rhythms.find((item) => item.id === courseRhythmId(stack.id));
            const courseDays = rhythm?.weekdays ?? [];

            return (
              <article className="sw-course-card" key={stack.id}>
                <div className="sw-course-card-top">
                  <div>
                    <p className="sw-course-child">{childName(children, stack.assignedTo)}</p>
                    <h2>{stack.name}</h2>
                  </div>
                  {canEdit ? (
                    <button type="button" className="sw-course-pause" onClick={() => void onToggleCourse(stack)}>
                      <LuPause aria-hidden="true" /> Pause
                    </button>
                  ) : null}
                </div>

                <div className="sw-course-progress-row">
                  <div className="sw-course-progress-track" aria-label={`${progress}% complete`}>
                    <span style={{ width: `${progress}%` }} />
                  </div>
                  <strong>{completed} / {total}</strong>
                </div>

                <div className="sw-course-next">
                  <span>{next?.status === "planned" ? "In progress" : "Next lesson"}</span>
                  <strong>{next?.title ?? "Course complete"}</strong>
                </div>

                <div className="sw-course-day-row" aria-label={`Normal days for ${stack.name}`}>
                  {weekDays.map((day) => {
                    const selected = courseDays.includes(day);
                    return (
                      <button
                        type="button"
                        key={day}
                        className={selected ? "is-selected" : ""}
                        disabled={!canEdit}
                        onClick={() => {
                          if (!canEdit) return;
                          const nextDays = selected ? courseDays.filter((item) => item !== day) : [...courseDays, day];
                          if (!nextDays.length) return;
                          void onUpdateDays(stack, nextDays);
                        }}
                        aria-pressed={selected}
                      >
                        {day.slice(0, 1)}
                      </button>
                    );
                  })}
                </div>

                <div className="sw-course-card-actions">
                  {canEdit && next ? <button type="button" className="sw-secondary-button" onClick={() => void onAddNext(stack)}>Put next lesson in today</button> : null}
                  <span>{courseDays.length ? `Normally ${courseDays.map((day) => day.slice(0, 3)).join(", ")}` : "Choose normal days"}</span>
                </div>
              </article>
            );
          })}
        </div>
      ) : null}

      {pausedStacks.length ? (
        <details className="sw-paused-courses">
          <summary><span>Paused courses ({pausedStacks.length})</span><LuChevronDown aria-hidden="true" /></summary>
          <div>
            {pausedStacks.map((stack) => (
              <article key={stack.id}>
                <span><strong>{stack.name}</strong><small>{childName(children, stack.assignedTo)} · {stack.items.filter((item) => item.status === "done").length}/{stack.items.length} complete</small></span>
                {canEdit ? <button type="button" onClick={() => void onToggleCourse(stack)}><LuPlay aria-hidden="true" /> Resume</button> : null}
              </article>
            ))}
          </div>
        </details>
      ) : null}

      <section className="sw-course-philosophy">
        <p className="sw-kicker">Why this works</p>
        <h2>No fake due dates to repair.</h2>
        <p>
          If Tuesday disappears, the next lesson is still the next lesson. SoftWeek does not mark your family late or force you to rebuild the rest of the year.
        </p>
      </section>
    </section>
  );
}
