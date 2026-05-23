"use client";

import { useState } from "react";
import AddPlanForm from "@/components/planner/AddPlanForm";
import WeeklyPlannerBoard from "@/components/planner/WeeklyPlannerBoard";
import { demoPlans } from "@/data/demoPlans";
import type {
  PlanCategory,
  PlannerItem,
  PlanStatus,
  WeekDay,
} from "@/types/planner";

export default function PlannerShell() {
  const [plans, setPlans] = useState<PlannerItem[]>(demoPlans);

  function handleAddPlan(plan: PlannerItem) {
    setPlans((current) => [plan, ...current]);
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
  }

  function handleStatusChange(id: string, status: PlanStatus) {
    setPlans((current) =>
      current.map((plan) => (plan.id === id ? { ...plan, status } : plan))
    );
  }

  function handleCategoryChange(id: string, category: PlanCategory) {
    setPlans((current) =>
      current.map((plan) => (plan.id === id ? { ...plan, category } : plan))
    );
  }

  function handleActualNotesChange(id: string, value: string) {
    setPlans((current) =>
      current.map((plan) =>
        plan.id === id ? { ...plan, actualNotes: value } : plan
      )
    );
  }

  function handleDelete(id: string) {
    setPlans((current) => current.filter((plan) => plan.id !== id));
  }

  function handleResetDemo() {
    setPlans(demoPlans);
  }

  return (
    <section className="section">
      <div className="container">
        <div className="section-center">
          <p className="eyebrow">Interactive planner demo</p>
          <h1 className="section-title">
            Plan gently. Move things around. Keep the week from feeling ruined.
          </h1>
          <p className="section-lead">
            This proof-of-concept is focused on the real homeschool planner
            problem: weeks change. Add loose plans, move them to another day,
            mark what happened, and keep a soft record without being locked into
            a rigid curriculum schedule.
          </p>

          <div className="btn-row" style={{ justifyContent: "center", marginTop: "1.5rem" }}>
            <button className="btn btn-secondary" type="button" onClick={handleResetDemo}>
              Reset demo
            </button>
          </div>
        </div>

        <div className="planner-demo-grid">
          <AddPlanForm onAddPlan={handleAddPlan} />

          <WeeklyPlannerBoard
            plans={plans}
            onMove={handleMove}
            onStatusChange={handleStatusChange}
            onCategoryChange={handleCategoryChange}
            onActualNotesChange={handleActualNotesChange}
            onDelete={handleDelete}
          />
        </div>
      </div>
    </section>
  );
}