"use client";

import { useEffect, useState } from "react";
import PlannerItemRow from "@/components/planner/redesign/PlannerItemRow";
import QuickAdd from "@/components/planner/redesign/QuickAdd";
import { dayLabels, weekDays } from "@/data/demoPlans";
import { dateKeyForDay, dayForDate } from "@/lib/plannerLogic";
import type { ChildProfile, PlannerItem, WeekDay } from "@/types/planner";

type WeekScreenProps = {
  plans: PlannerItem[];
  children: ChildProfile[];
  weekStart: string;
  weekLabel: string;
  activeChildId: string;
  canEdit: boolean;
  canMove: boolean;
  focusToken?: number;
  onChildChange: (value: string) => void;
  onSwitchWeek: (direction: number) => void;
  onThisWeek: () => void;
  onAdd: React.ComponentProps<typeof QuickAdd>["onAdd"];
  onPaste: NonNullable<React.ComponentProps<typeof QuickAdd>["onPaste"]>;
  onComplete: (item: PlannerItem) => void;
  onRestore: (item: PlannerItem) => void;
  onMove: (item: PlannerItem, day: WeekDay | null) => void;
  onSkip: (item: PlannerItem) => void;
  onDelete: (item: PlannerItem) => void;
  onNote: (item: PlannerItem, note: string) => void;
  onMakeRhythm: (item: PlannerItem) => void;
  onLifeHappened: (day?: WeekDay) => void;
  onOpenRhythms: () => void;
  onOpenStacks: () => void;
  onCopyLastWeek: () => void;
  onCloseout: () => void;
};

function matchesChild(item: PlannerItem, childId: string) {
  return childId === "all" || item.assignedTo === "everyone" || item.assignedTo === childId;
}

export default function WeekScreen(props: WeekScreenProps) {
  const [openDays, setOpenDays] = useState<WeekDay[]>(weekDays as unknown as WeekDay[]);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 720px)");
    const setResponsiveDays = () => {
      if (media.matches) {
        const today = dayForDate(props.weekStart);
        setOpenDays(today ? [today] : ["Monday"]);
      } else {
        setOpenDays(weekDays as unknown as WeekDay[]);
      }
    };
    setResponsiveDays();
    media.addEventListener("change", setResponsiveDays);
    return () => media.removeEventListener("change", setResponsiveDays);
  }, [props.weekStart]);

  const filtered = props.plans.filter((item) => matchesChild(item, props.activeChildId));
  const unscheduled = filtered.filter((item) => item.placement === "week");

  return (
    <section className="sw-screen sw-week-screen">
      <header className="sw-week-toolbar">
        <div className="sw-week-nav">
          <button type="button" aria-label="Previous week" onClick={() => props.onSwitchWeek(-1)}>‹</button>
          <div><p className="sw-kicker">Week</p><h1>{props.weekLabel}</h1></div>
          <button type="button" aria-label="Next week" onClick={() => props.onSwitchWeek(1)}>›</button>
        </div>
        <div className="sw-week-toolbar-actions">
          <button type="button" className="sw-secondary-button" onClick={props.onThisWeek}>This week</button>
          <label className="sw-child-filter"><span>Show</span><select value={props.activeChildId} onChange={(event) => props.onChildChange(event.target.value)}><option value="all">Everyone</option>{props.children.filter((child) => child.id !== "everyone").map((child) => <option key={child.id} value={child.id}>{child.name}</option>)}</select></label>
        </div>
      </header>

      {props.canEdit ? <QuickAdd children={props.children} defaultDay={null} focusToken={props.focusToken} onAdd={props.onAdd} onPaste={props.onPaste} /> : null}

      {props.canEdit ? (
        <nav className="sw-week-tools" aria-label="Week tools">
          <button type="button" onClick={props.onCopyLastWeek}>Copy last week</button>
          <button type="button" onClick={props.onOpenRhythms}>Weekly Rhythm</button>
          <button type="button" onClick={props.onOpenStacks}>Lesson Stacks</button>
          <button type="button" onClick={() => props.onLifeHappened()}>Life Happened</button>
          <button type="button" onClick={props.onCloseout}>Wrap up week</button>
        </nav>
      ) : null}

      <section className="sw-week-inbox">
        <div className="sw-section-heading">
          <div><h2>This Week</h2><p>Work that belongs in the week without forcing it onto a day.</p></div>
          <span>{unscheduled.length}</span>
        </div>
        <div className="sw-item-list">
          {unscheduled.map((item) => <PlannerItemRow key={item.id} item={item} children={props.children} canEdit={props.canEdit} canMove={props.canMove} onComplete={props.onComplete} onRestore={props.onRestore} onMove={props.onMove} onSkip={props.onSkip} onDelete={props.onDelete} onNote={props.onNote} onMakeRhythm={props.onMakeRhythm} />)}
          {!unscheduled.length ? <div className="sw-empty-line">Nothing is waiting here. Add ideas before deciding where they fit.</div> : null}
        </div>
      </section>

      <div className="sw-week-days">
        {weekDays.map((day) => {
          const dayItems = filtered.filter((item) => item.placement === "day" && item.day === day);
          const open = openDays.includes(day);
          const date = new Date(`${dateKeyForDay(props.weekStart, day)}T12:00:00`);
          return (
            <section className="sw-day-section" key={day}>
              <div className="sw-day-heading">
                <button type="button" onClick={() => setOpenDays((current) => current.includes(day) ? current.filter((item) => item !== day) : [...current, day])} aria-expanded={open}>
                  <span><strong>{day}</strong><small>{date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}</small></span>
                  <span>{dayItems.length} {open ? "−" : "+"}</span>
                </button>
                {props.canEdit ? <button type="button" className="sw-day-recovery" onClick={() => props.onLifeHappened(day)}>Life happened</button> : null}
              </div>
              {open ? (
                <div className="sw-item-list">
                  {dayItems.map((item) => <PlannerItemRow key={item.id} item={item} children={props.children} canEdit={props.canEdit} canMove={props.canMove} onComplete={props.onComplete} onRestore={props.onRestore} onMove={props.onMove} onSkip={props.onSkip} onDelete={props.onDelete} onNote={props.onNote} onMakeRhythm={props.onMakeRhythm} />)}
                  {!dayItems.length ? <div className="sw-empty-line">No plans for {dayLabels[day]}.</div> : null}
                </div>
              ) : null}
            </section>
          );
        })}
      </div>
    </section>
  );
}
