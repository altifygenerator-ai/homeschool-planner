"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import AddPlanForm from "@/components/planner/AddPlanForm";
import ChildSelector from "@/components/planner/ChildSelector";
import SaveWeekPanel from "@/components/planner/SaveWeekPanel";
import WeeklyPlannerBoard from "@/components/planner/WeeklyPlannerBoard";
import {
  clearCurrentPlans,
  deleteChildProfile,
  getChildren,
  getCurrentPlans,
  renameChildProfile,
  saveChildren,
  saveCurrentPlans,
  saveWeekLog,
} from "@/lib/plannerStorage";
import { createId } from "@/lib/utils";
import type {
  ChildProfile,
  PlanCategory,
  PlannerItem,
  PlanStatus,
  SavedWeekLog,
  WeekDay,
} from "@/types/planner";

const colorLabels: ChildProfile["colorLabel"][] = ["sage", "gold", "clay", "blue"];

export default function PlannerShell() {
  const [plans, setPlans] = useState<PlannerItem[]>([]);
  const [children, setChildren] = useState<ChildProfile[]>([]);
  const [activeChildId, setActiveChildId] = useState("all");
  const [hasLoaded, setHasLoaded] = useState(false);
  const [savedMessage, setSavedMessage] = useState("");
  const [isAddingPlan, setIsAddingPlan] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setPlans(getCurrentPlans());
      setChildren(getChildren());
      setHasLoaded(true);
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!hasLoaded) return;
    saveCurrentPlans(plans);
  }, [plans, hasLoaded]);

  const visiblePlans = useMemo(() => {
    if (activeChildId === "all") return plans;

    return plans.filter(
      (plan) =>
        plan.assignedTo === activeChildId || plan.assignedTo === "everyone"
    );
  }, [activeChildId, plans]);

  function handleAddPlans(newPlans: PlannerItem[]) {
    setPlans((current) => [...newPlans, ...current]);
    setSavedMessage("");
    setIsAddingPlan(false);
  }

  function handleMove(id: string, day: WeekDay) {
    setPlans((current) =>
      current.map((plan) =>
        plan.id === id
          ? {
              ...plan,
              day,
              status: plan.status === "done" ? plan.status : "moved",
            }
          : plan
      )
    );

    setSavedMessage("");
  }

  function handleStatusChange(id: string, status: PlanStatus) {
    setPlans((current) =>
      current.map((plan) => (plan.id === id ? { ...plan, status } : plan))
    );

    setSavedMessage("");
  }

  function handleCategoryChange(id: string, category: PlanCategory) {
    setPlans((current) =>
      current.map((plan) => (plan.id === id ? { ...plan, category } : plan))
    );

    setSavedMessage("");
  }

  function handleActualNotesChange(id: string, value: string) {
    setPlans((current) =>
      current.map((plan) =>
        plan.id === id ? { ...plan, actualNotes: value } : plan
      )
    );

    setSavedMessage("");
  }

  function handleDelete(id: string) {
    setPlans((current) => current.filter((plan) => plan.id !== id));
    setSavedMessage("");
  }

  function handleClearWeek() {
    clearCurrentPlans();
    setPlans([]);
    setActiveChildId("all");
    setSavedMessage("Current week cleared. You can start fresh whenever you are ready.");
  }

  function handleStartFreshWeek() {
    clearCurrentPlans();
    setPlans([]);
    setActiveChildId("all");
    setSavedMessage("Fresh week started.");
  }

  function handleSaveWeek(week: SavedWeekLog) {
    saveWeekLog(week);
    setSavedMessage("Week saved. You can start a fresh week or keep editing this one.");
  }

  function handleAddChild(name: string) {
    const realChildCount = children.filter((child) => child.id !== "everyone").length;
    const nextChild: ChildProfile = {
      id: createId("child"),
      name,
      colorLabel: colorLabels[realChildCount % colorLabels.length],
    };

    const nextChildren = [...children, nextChild];
    saveChildren(nextChildren);
    setChildren(getChildren());
    setSavedMessage(`${name} added. You can assign plans to them now.`);
  }

  function handleRenameChild(childId: string, name: string) {
    setChildren(renameChildProfile(childId, name));
    setSavedMessage("Child profile updated.");
  }

  function handleDeleteChild(childId: string) {
    const childName = children.find((child) => child.id === childId)?.name ?? "Child";
    setChildren(deleteChildProfile(childId));
    setPlans(getCurrentPlans());

    if (activeChildId === childId) {
      setActiveChildId("all");
    }

    setSavedMessage(`${childName} removed. Any current plans for them were moved to Everyone.`);
  }

  return (
    <div className="planner-workspace planner-workspace-calm">
      <section className="planner-page-heading planner-page-heading-calm">
        <div>
          <p className="eyebrow">Current planner</p>

          <h1 className="section-title">
            Plan the week. Move what changes. Save what happened.
          </h1>

          <p className="section-lead">
            Start with the week board. Add plans when you need them, filter by
            child when helpful, and save the record when the week feels ready.
          </p>
        </div>
      </section>

      <section className="planner-control-strip soft-card">
        <div className="planner-control-copy">
          <p className="control-kicker">This week</p>
          <strong>{plans.length} plans on the board</strong>
          <span>
            Add only what helps. The board stays movable, even when the week changes.
          </span>
        </div>

        <div className="planner-control-actions">
          <button
            className="btn btn-primary"
            type="button"
            onClick={() => setIsAddingPlan((current) => !current)}
          >
            {isAddingPlan ? "Close form" : "+ Add plan"}
          </button>

          <Link className="btn btn-secondary" href="/dashboard/weeks">
            Saved weeks
          </Link>

          <button
            className="btn btn-secondary"
            type="button"
            onClick={handleClearWeek}
          >
            Clear week
          </button>
        </div>
      </section>

      {savedMessage ? (
        <div className="planner-save-message-row">
          <p className="planner-save-message">{savedMessage}</p>
          {savedMessage.startsWith("Week saved") ? (
            <button
              className="mini-text-button"
              type="button"
              onClick={handleStartFreshWeek}
            >
              Start fresh week
            </button>
          ) : null}
        </div>
      ) : null}

      {isAddingPlan ? (
        <section className="planner-add-row planner-add-row-open">
          <AddPlanForm childProfiles={children} onAddPlans={handleAddPlans} />
        </section>
      ) : null}

      <section className="planner-tools-row planner-tools-row-calm">
        <ChildSelector
          childProfiles={children}
          activeChildId={activeChildId}
          onChange={setActiveChildId}
          onAddChild={handleAddChild}
          onRenameChild={handleRenameChild}
          onDeleteChild={handleDeleteChild}
        />

        <SaveWeekPanel
          plans={plans}
          childProfiles={children}
          onSaveWeek={handleSaveWeek}
        />
      </section>

      <section className="planner-board-row">
        <WeeklyPlannerBoard
          plans={visiblePlans}
          childProfiles={children}
          onMove={handleMove}
          onStatusChange={handleStatusChange}
          onCategoryChange={handleCategoryChange}
          onActualNotesChange={handleActualNotesChange}
          onDelete={handleDelete}
        />
      </section>
    </div>
  );
}
