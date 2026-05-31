"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import AddPlanForm from "@/components/planner/AddPlanForm";
import ChildSelector from "@/components/planner/ChildSelector";
import SaveWeekPanel from "@/components/planner/SaveWeekPanel";
import WeeklyPlannerBoard from "@/components/planner/WeeklyPlannerBoard";
import { demoChildren } from "@/data/demoChildren";
import { demoPlans } from "@/data/demoPlans";
import {
  clearCurrentPlans,
  getCurrentPlans,
  saveCurrentPlans,
  saveWeekLog,
} from "@/lib/plannerStorage";
import type {
  PlanCategory,
  PlannerItem,
  PlanStatus,
  SavedWeekLog,
  WeekDay,
} from "@/types/planner";

export default function PlannerShell() {
  const [plans, setPlans] = useState<PlannerItem[]>(demoPlans);
  const [activeChildId, setActiveChildId] = useState("all");
  const [hasLoaded, setHasLoaded] = useState(false);
  const [savedMessage, setSavedMessage] = useState("");

  useEffect(() => {
    const storedPlans = getCurrentPlans();

    if (storedPlans.length) {
      setPlans(storedPlans);
    }

    setHasLoaded(true);
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

  function handleResetDemo() {
    clearCurrentPlans();
    setPlans(demoPlans);
    setActiveChildId("all");
    setSavedMessage("");
  }

  function handleSaveWeek(week: SavedWeekLog) {
    saveWeekLog(week);
    setSavedMessage("Week saved. You can view it in Saved Weeks.");
  }

  return (
    <div className="planner-workspace">
      <section className="planner-page-heading">
        <div>
          <p className="eyebrow">Current planner</p>

          <h1 className="section-title">
            Plan gently, then save the week when it’s ready.
          </h1>

          <p className="section-lead">
            Add loose plans, place them on one day or several, move things
            around, mark what happened, and save the week as a simple record.
          </p>
        </div>

        <div className="planner-heading-actions">
          <button
            className="btn btn-secondary"
            type="button"
            onClick={handleResetDemo}
          >
            Reset demo
          </button>

          <Link className="btn btn-secondary" href="/dashboard/weeks">
            View saved weeks
          </Link>
        </div>

        {savedMessage ? (
          <p className="planner-save-message">{savedMessage}</p>
        ) : null}
      </section>

      <section className="planner-add-row">
        <AddPlanForm children={demoChildren} onAddPlans={handleAddPlans} />
      </section>

      <section className="planner-tools-row">
        <ChildSelector
          children={demoChildren}
          activeChildId={activeChildId}
          onChange={setActiveChildId}
        />

        <SaveWeekPanel
          plans={plans}
          children={demoChildren}
          onSaveWeek={handleSaveWeek}
        />
      </section>

      <section className="planner-board-row">
        <WeeklyPlannerBoard
          plans={visiblePlans}
          children={demoChildren}
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