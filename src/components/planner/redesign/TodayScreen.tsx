"use client";

import { useMemo, useState } from "react";
import QuickAdd from "@/components/planner/redesign/QuickAdd";
import PlannerItemRow from "@/components/planner/redesign/PlannerItemRow";
import { dateKeyForDay, unfinishedBeforeDay } from "@/lib/plannerLogic";
import type { ChildProfile, PlannerItem, WeekDay } from "@/types/planner";

type TodayScreenProps = {
  plans: PlannerItem[];
  children: ChildProfile[];
  weekStart: string;
  day: WeekDay;
  activeChildId: string;
  canEdit: boolean;
  canMove: boolean;
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
};

function matchesChild(item: PlannerItem, childId: string) {
  return childId === "all" || item.assignedTo === "everyone" || item.assignedTo === childId;
}

export default function TodayScreen(props: TodayScreenProps) {
  const [completedOpen, setCompletedOpen] = useState(false);
  const dateKey = dateKeyForDay(props.weekStart, props.day);
  const date = new Date(`${dateKey}T12:00:00`);
  const filtered = props.plans.filter((item) => matchesChild(item, props.activeChildId));
  const scheduled = filtered.filter((item) => item.placement === "day" && item.day === props.day && item.status !== "done");
  const carried = unfinishedBeforeDay(filtered, props.weekStart, props.day);
  const completed = filtered.filter((item) => item.status === "done" && (item.actualDate === dateKey || item.day === props.day));
  const openItems = useMemo(() => {
    const seen = new Set<string>();
    return [...carried, ...scheduled].filter((item) => {
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });
  }, [carried, scheduled]);

  return (
    <section className="sw-screen sw-today-screen">
      <header className="sw-screen-header">
        <div>
          <p className="sw-kicker">Today</p>
          <h1>{date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</h1>
          <p>See what matters now. Move the rest without rebuilding the week.</p>
        </div>
        <label className="sw-child-filter">
          <span>Show</span>
          <select value={props.activeChildId} onChange={(event) => props.onChildChange(event.target.value)}>
            <option value="all">Everyone</option>
            {props.children.filter((child) => child.id !== "everyone").map((child) => <option key={child.id} value={child.id}>{child.name}</option>)}
          </select>
        </label>
      </header>

      {props.canEdit ? (
        <QuickAdd children={props.children} defaultDay={props.day} focusToken={props.focusToken} compact onAdd={props.onAdd} />
      ) : null}

      {carried.length ? (
        <section className="sw-list-section sw-carry-section">
          <div className="sw-section-heading">
            <div>
              <h2>Still open from earlier</h2>
              <p>These were not finished on a previous day. Nothing has been marked late.</p>
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
            <p>{openItems.length ? "Work through the list in any order." : "This day is open. Add something only when it helps."}</p>
          </div>
        </div>
        <div className="sw-item-list">
          {scheduled.map((item) => <PlannerItemRow key={item.id} item={item} children={props.children} canEdit={props.canEdit} canMove={props.canMove} onComplete={props.onComplete} onRestore={props.onRestore} onMove={props.onMove} onSkip={props.onSkip} onDelete={props.onDelete} onNote={props.onNote} onMakeRhythm={props.onMakeRhythm} />)}
          {!scheduled.length ? <div className="sw-empty-line">No scheduled items for this day.</div> : null}
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
