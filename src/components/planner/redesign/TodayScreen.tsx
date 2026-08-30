"use client";

import { useMemo, useState } from "react";
import QuickAdd from "@/components/planner/redesign/QuickAdd";
import PlannerItemRow from "@/components/planner/redesign/PlannerItemRow";
import { dateKeyForDay, unfinishedBeforeDay } from "@/lib/plannerLogic";
import type { ChildProfile, LessonStack, PlannerItem, WeekDay } from "@/types/planner";

type TodayScreenProps = {
  plans: PlannerItem[];
  children: ChildProfile[];
  stacks: LessonStack[];
  weekStart: string;
  day: WeekDay;
  activeChildId: string;
  canEdit: boolean;
  canMove: boolean;
  isGuest?: boolean;
  focusToken?: number;
  onChildChange: (value: string) => void;
  onAdd: React.ComponentProps<typeof QuickAdd>["onAdd"];
  onComplete: (item: PlannerItem) => void;
  onRestore: (item: PlannerItem) => void;
  onMove: (item: PlannerItem, day: WeekDay | null) => void;
  onSkip: (item: PlannerItem) => void;
  onDelete: (item: PlannerItem) => void;
  onNote: (item: PlannerItem, note: string) => void;
  onMakeRhythm: (item: PlannerItem) => void;
  onOpenCourses: () => void;
  onLogDone: (title: string, assignedTo: string) => Promise<void> | void;
};

function matchesChild(item: PlannerItem, childId: string) {
  return childId === "all" || item.assignedTo === "everyone" || item.assignedTo === childId;
}

export default function TodayScreen(props: TodayScreenProps) {
  const [completedOpen, setCompletedOpen] = useState(false);
  const [logOpen, setLogOpen] = useState(false);
  const [logTitle, setLogTitle] = useState("");
  const [logChild, setLogChild] = useState("everyone");
  const [logging, setLogging] = useState(false);
  const [logError, setLogError] = useState("");
  const dateKey = dateKeyForDay(props.weekStart, props.day);
  const date = new Date(`${dateKey}T12:00:00`);
  const filtered = props.plans.filter((item) => matchesChild(item, props.activeChildId));
  const scheduled = filtered.filter((item) => item.placement === "day" && item.day === props.day && item.status !== "done");
  const carried = unfinishedBeforeDay(filtered, props.weekStart, props.day);
  const completed = filtered.filter((item) => item.status === "done" && (item.actualDate === dateKey || item.day === props.day));
  const activeCourses = props.stacks.filter((stack) => stack.active && (props.activeChildId === "all" || stack.assignedTo === "everyone" || stack.assignedTo === props.activeChildId));
  const hasGuestSample = props.isGuest && props.plans.some((item) => item.id.startsWith("guest-demo-"));
  const openItems = useMemo(() => {
    const seen = new Set<string>();
    return [...carried, ...scheduled].filter((item) => {
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });
  }, [carried, scheduled]);

  async function submitLog() {
    if (!logTitle.trim() || logging) return;
    setLogging(true);
    setLogError("");
    try {
      await props.onLogDone(logTitle, logChild);
      setLogTitle("");
      setLogOpen(false);
    } catch (error) {
      setLogError(error instanceof Error ? error.message : "That completed work could not be logged.");
    } finally {
      setLogging(false);
    }
  }

  return (
    <section className="sw-screen sw-today-screen">
      <header className="sw-screen-header">
        <div>
          <p className="sw-kicker">Today</p>
          <h1>{date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</h1>
          <p>Do what is next. If the day changes, nothing becomes late and your course order stays intact.</p>
        </div>
        <label className="sw-child-filter">
          <span>Show</span>
          <select value={props.activeChildId} onChange={(event) => props.onChildChange(event.target.value)}>
            <option value="all">Everyone</option>
            {props.children.filter((child) => child.id !== "everyone").map((child) => <option key={child.id} value={child.id}>{child.name}</option>)}
          </select>
        </label>
      </header>

      {hasGuestSample ? (
        <div className="sw-sample-banner">
          <div><strong>This is a sample day.</strong><span>Check something off, open the menus, or add your own item. Sample work will not be copied into an account.</span></div>
          <button type="button" onClick={props.onOpenCourses}>See how Courses work</button>
        </div>
      ) : null}

      {activeCourses.length ? (
        <section className="sw-today-course-strip">
          <div className="sw-section-heading">
            <div>
              <h2>Course progress</h2>
              <p>SoftWeek keeps the next lesson moving without dating the whole curriculum.</p>
            </div>
            <button type="button" className="sw-text-button" onClick={props.onOpenCourses}>Open Courses</button>
          </div>
          <div className="sw-course-mini-grid">
            {activeCourses.slice(0, 4).map((stack) => {
              const done = stack.items.filter((item) => item.status === "done").length;
              const next = [...stack.items].sort((a, b) => a.position - b.position).find((item) => item.status === "planned" || item.status === "queued");
              return (
                <button type="button" className="sw-course-mini" key={stack.id} onClick={props.onOpenCourses}>
                  <span><strong>{stack.name}</strong><small>{done}/{stack.items.length} complete</small></span>
                  <em>{next?.status === "planned" ? "In progress" : next ? `Next: ${next.title}` : "Complete"}</em>
                </button>
              );
            })}
          </div>
        </section>
      ) : props.canEdit ? (
        <section className="sw-course-start-card">
          <div>
            <p className="sw-kicker">Make tomorrow easier</p>
            <h2>Load a course once and let SoftWeek keep the next lesson ready.</h2>
            <p>Paste a lesson list, choose the normal days, and stop rescheduling the rest of the year every time life changes.</p>
          </div>
          <button type="button" className="sw-primary-button" onClick={props.onOpenCourses}>Set up a course</button>
        </section>
      ) : null}

      {props.canEdit ? (
        <>
          <QuickAdd children={props.children} defaultDay={props.day} focusToken={props.focusToken} compact onAdd={props.onAdd} />
          <div className="sw-log-done-wrap">
            <button type="button" className="sw-text-button" onClick={() => setLogOpen((value) => !value)}>
              {logOpen ? "Close quick log" : "Already did something? Log it as done"}
            </button>
            {logOpen ? (
              <div className="sw-log-done-panel">
                <input
                  value={logTitle}
                  onChange={(event) => setLogTitle(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      void submitLog();
                    }
                  }}
                  placeholder="Nature walk, read chapter 4, museum visit..."
                  aria-label="Completed work"
                />
                <select value={logChild} onChange={(event) => setLogChild(event.target.value)} aria-label="Who completed this work">
                  {props.children.map((child) => <option value={child.id} key={child.id}>{child.name}</option>)}
                </select>
                <button type="button" className="sw-secondary-button" onClick={() => void submitLog()} disabled={!logTitle.trim() || logging}>{logging ? "Saving…" : "Log done"}</button>
                {logError ? <p role="alert">{logError}</p> : null}
              </div>
            ) : null}
          </div>
        </>
      ) : null}

      {carried.length ? (
        <section className="sw-list-section sw-carry-section">
          <div className="sw-section-heading">
            <div>
              <h2>Still open</h2>
              <p>These came from earlier in the week. SoftWeek kept them open instead of marking them late.</p>
            </div>
          </div>
          <div className="sw-item-list">
            {carried.map((item) => <PlannerItemRow key={item.id} item={item} children={props.children} canEdit={props.canEdit} canMove={props.canMove} onComplete={props.onComplete} onRestore={props.onRestore} onMove={props.onMove} onSkip={props.onSkip} onDelete={props.onDelete} onNote={props.onNote} onMakeRhythm={props.onMakeRhythm} />)}
          </div>
        </section>
      ) : null}

      <section className="sw-list-section">
        <div className="sw-section-heading">
          <div>
            <h2>{props.day}</h2>
            <p>{openItems.length ? "Work through the list in any order." : activeCourses.length ? "Nothing else needs your attention right now." : "This day is open. Add something only when it helps."}</p>
          </div>
        </div>
        <div className="sw-item-list">
          {scheduled.map((item) => <PlannerItemRow key={item.id} item={item} children={props.children} canEdit={props.canEdit} canMove={props.canMove} onComplete={props.onComplete} onRestore={props.onRestore} onMove={props.onMove} onSkip={props.onSkip} onDelete={props.onDelete} onNote={props.onNote} onMakeRhythm={props.onMakeRhythm} />)}
          {!scheduled.length ? <div className="sw-empty-line">No open items for this day.</div> : null}
        </div>
      </section>

      {completed.length ? (
        <section className="sw-list-section sw-completed-section">
          <button className="sw-collapsible-heading" type="button" onClick={() => setCompletedOpen((value) => !value)} aria-expanded={completedOpen}>
            <span>Completed today</span>
            <span>{completed.length} {completedOpen ? "−" : "+"}</span>
          </button>
          {completedOpen ? (
            <div className="sw-item-list">
              {completed.map((item) => <PlannerItemRow key={item.id} item={item} children={props.children} canEdit={props.canEdit} canMove={props.canMove} onComplete={props.onComplete} onRestore={props.onRestore} onMove={props.onMove} onSkip={props.onSkip} onDelete={props.onDelete} onNote={props.onNote} onMakeRhythm={props.onMakeRhythm} />)}
            </div>
          ) : null}
        </section>
      ) : null}
    </section>
  );
}
