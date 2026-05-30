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

  function handleAddPlan(plan: PlannerItem) {
    setPlans((current) => [plan, ...current]);
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
    <div>
      <div className="dashboard-page-heading">
        <p className="eyebrow">Current planner</p>
        <h1 className="section-title">
          Plan gently, then save the week when it’s ready.
        </h1>
        <p className="section-lead">
          This page is only for the current week: add loose plans, move things
          around, mark what happened, and save the week record.
        </p>

        <div
          className="btn-row"
          style={{ justifyContent: "center", marginTop: "1.5rem" }}
        >
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
      </div>

      <div className="planner-demo-grid">
        <div className="stack-md">
          <AddPlanForm children={demoChildren} onAddPlan={handleAddPlan} />

          <SaveWeekPanel
            plans={plans}
            children={demoChildren}
            onSaveWeek={handleSaveWeek}
          />
        </div>

        <div className="stack-md">
          <ChildSelector
            children={demoChildren}
            activeChildId={activeChildId}
            onChange={setActiveChildId}
          />

          <WeeklyPlannerBoard
            plans={visiblePlans}
            children={demoChildren}
            onMove={handleMove}
            onStatusChange={handleStatusChange}
            onCategoryChange={handleCategoryChange}
            onActualNotesChange={handleActualNotesChange}
            onDelete={handleDelete}
          />
        </div>
      </div>
    </div>
  );
}