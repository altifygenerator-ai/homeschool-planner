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
    <div className="planner-workspace">
      <section className="planner-page-heading">
        <div>
          <p className="eyebrow">Current planner</p>

          <h1 className="section-title">
            Plan the week, move what changes, save what happened.
          </h1>

          <p className="section-lead">
            Start right here. Add your children, place plans on one day or
            several, adjust the week as life happens, and save a simple record
            when you are ready.
          </p>
        </div>

        <div className="planner-heading-actions">
          <button
            className="btn btn-secondary"
            type="button"
            onClick={handleClearWeek}
          >
            Clear current week
          </button>

          <Link className="btn btn-secondary" href="/dashboard/weeks">
            View saved weeks
          </Link>
        </div>

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
      </section>

      <section className="planner-add-row">
        <AddPlanForm childProfiles={children} onAddPlans={handleAddPlans} />
      </section>

      <section className="planner-tools-row">
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
