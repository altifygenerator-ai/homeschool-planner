"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import AddPlanForm from "@/components/planner/AddPlanForm";
import ChildSelector from "@/components/planner/ChildSelector";
import SaveWeekPanel from "@/components/planner/SaveWeekPanel";
import WeeklyPlannerBoard from "@/components/planner/WeeklyPlannerBoard";
import {
  addCategoryDefinition,
  clearPlansForWeek,
  deleteChildProfile,
  getActiveWeekStart,
  getCategoryDefinitions,
  getChildren,
  getPlansForWeek,
  renameChildProfile,
  saveActiveWeekStart,
  saveCategoryDefinitions,
  saveChildren,
  savePlansForWeek,
  saveWeekLog,
} from "@/lib/plannerStorage";
import {
  getActiveAccountContext,
  type AccountContext,
} from "@/lib/localAuth";
import {
  getCurrentWeekRange,
  getWeekRangeFromStart,
  shiftWeekStart,
} from "@/lib/week";
import { createId } from "@/lib/utils";
import type {
  CategoryDefinition,
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
  const [categories, setCategories] = useState<CategoryDefinition[]>([]);
  const [activeChildId, setActiveChildId] = useState("all");
  const [activeWeekStart, setActiveWeekStart] = useState("");
  const [hasLoaded, setHasLoaded] = useState(false);
  const [savedMessage, setSavedMessage] = useState("");
  const [isAddingPlan, setIsAddingPlan] = useState(false);
  const [accountContext, setAccountContext] = useState<AccountContext | null>(null);

  const isChildView = accountContext?.isChild ?? false;
  const canPlan = accountContext?.account.permissions.canPlan ?? true;
  const canManageChildren = accountContext?.account.permissions.canManageChildren ?? true;
  const canSaveWeeks = accountContext?.account.permissions.canSaveWeeks ?? true;
  const canEditCategories = accountContext?.account.permissions.canEditCategories ?? true;

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const context = getActiveAccountContext();
      const savedWeekStart = getActiveWeekStart();

      setAccountContext(context);
      setActiveWeekStart(savedWeekStart);
      setPlans(getPlansForWeek(savedWeekStart));
      setChildren(getChildren());
      setCategories(getCategoryDefinitions());
      setActiveChildId(context?.isChild && context.session.childId ? context.session.childId : "all");
      setHasLoaded(true);
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    function refreshContext() {
      setAccountContext(getActiveAccountContext());
    }

    window.addEventListener("softweek-session-changed", refreshContext);
    return () => window.removeEventListener("softweek-session-changed", refreshContext);
  }, []);

  useEffect(() => {
    if (!hasLoaded || !activeWeekStart) return;
    savePlansForWeek(activeWeekStart, plans);
  }, [plans, activeWeekStart, hasLoaded]);

  const weekRange = useMemo(() => {
    return activeWeekStart
      ? getWeekRangeFromStart(activeWeekStart)
      : getCurrentWeekRange();
  }, [activeWeekStart]);

  const visibleChildren = useMemo(() => {
    if (!isChildView || !accountContext?.session.childId) return children;

    return children.filter(
      (child) => child.id === "everyone" || child.id === accountContext.session.childId
    );
  }, [accountContext, children, isChildView]);

  const visiblePlans = useMemo(() => {
    if (isChildView && accountContext?.session.childId) {
      return plans.filter(
        (plan) =>
          plan.assignedTo === accountContext.session.childId ||
          plan.assignedTo === "everyone"
      );
    }

    if (activeChildId === "all") return plans;

    return plans.filter(
      (plan) =>
        plan.assignedTo === activeChildId || plan.assignedTo === "everyone"
    );
  }, [accountContext, activeChildId, isChildView, plans]);

  function reloadWeek(weekStart: string) {
    setActiveWeekStart(weekStart);
    saveActiveWeekStart(weekStart);
    setPlans(getPlansForWeek(weekStart));
    setActiveChildId(isChildView && accountContext?.session.childId ? accountContext.session.childId : "all");
    setIsAddingPlan(false);
  }

  function handleSwitchWeek(direction: number) {
    if (!activeWeekStart) return;

    savePlansForWeek(activeWeekStart, plans);
    const nextWeekStart = shiftWeekStart(activeWeekStart, direction);
    reloadWeek(nextWeekStart);
    setSavedMessage(direction > 0 ? "Next week opened." : "Previous week opened.");
  }

  function handleThisWeek() {
    if (!activeWeekStart) return;

    savePlansForWeek(activeWeekStart, plans);
    reloadWeek(getCurrentWeekRange().weekStart);
    setSavedMessage("Current week opened.");
  }

  function handleAddPlans(newPlans: PlannerItem[]) {
    if (!canPlan) return;

    setPlans((current) => [...newPlans, ...current]);
    setSavedMessage("");
    setIsAddingPlan(false);
  }

  function handleMove(id: string, day: WeekDay) {
    if (!canPlan) return;

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
    if (!canPlan) return;

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
    if (!canPlan) return;

    setPlans((current) => current.filter((plan) => plan.id !== id));
    setSavedMessage("");
  }

  function handleClearWeek() {
    if (!activeWeekStart || !canPlan) return;

    clearPlansForWeek(activeWeekStart);
    setPlans([]);
    setActiveChildId("all");
    setSavedMessage(`${weekRange.weekLabel} cleared. You can start fresh whenever you are ready.`);
  }

  function handleStartFreshWeek() {
    if (!activeWeekStart || !canPlan) return;

    const nextWeekStart = shiftWeekStart(activeWeekStart, 1);

    clearPlansForWeek(nextWeekStart);
    saveActiveWeekStart(nextWeekStart);
    setActiveWeekStart(nextWeekStart);
    setPlans([]);
    setActiveChildId("all");
    setSavedMessage("Fresh week started.");
    setIsAddingPlan(true);
  }

  function handleSaveWeek(week: SavedWeekLog) {
    if (!canSaveWeeks) return;

    saveWeekLog(week);
    setSavedMessage("Week saved. You can start a fresh week or keep editing this one.");
  }

  function handleAddCategory(name: string) {
    if (!canEditCategories) return categories[0];

    const nextCategory = addCategoryDefinition(name);

    if (nextCategory) {
      const nextCategories = getCategoryDefinitions();
      saveCategoryDefinitions(nextCategories);
      setCategories(nextCategories);
      setSavedMessage(`${nextCategory.label} added as a category.`);
    }

    return nextCategory;
  }

  function handleAddChild(name: string) {
    if (!canManageChildren) return;

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
    if (!canManageChildren) return;

    setChildren(renameChildProfile(childId, name));
    setSavedMessage("Child profile updated.");
  }

  function handleDeleteChild(childId: string) {
    if (!canManageChildren) return;

    const childName = children.find((child) => child.id === childId)?.name ?? "Child";
    setChildren(deleteChildProfile(childId));
    setPlans(getPlansForWeek(activeWeekStart));

    if (activeChildId === childId) {
      setActiveChildId("all");
    }

    setSavedMessage(`${childName} removed. Any current plans for them were moved to Everyone.`);
  }

  return (
    <div className="planner-workspace planner-workspace-calm">
      <section className="planner-page-heading planner-page-heading-calm">
        <div>
          <p className="eyebrow">{isChildView ? "Child view" : "Current planner"}</p>

          <h1 className="section-title">
            {isChildView
              ? "Check the week and mark what happened."
              : "Plan the week. Move what changes. Save what happened."}
          </h1>

          <p className="section-lead">
            {isChildView
              ? "This limited view lets an older child mark work done, skip what needs skipped, and add notes without changing the whole family planner."
              : "Plan weekdays or weekends, add your own categories, move cards when life changes, and save the record when the week feels ready."}
          </p>
        </div>
      </section>

      <section className="planner-control-strip soft-card">
        <div className="planner-control-copy">
          <p className="control-kicker">Week of {weekRange.weekLabel}</p>
          <strong>{visiblePlans.length} plans in this view</strong>
          <span>
            {isChildView
              ? "Parent controls are limited in this child login."
              : "Open a different week if you want to plan ahead, or keep this week simple."}
          </span>
        </div>

        <div className="planner-control-actions planner-control-actions-expanded">
          <div className="week-switcher">
            <button className="mini-text-button" type="button" onClick={() => handleSwitchWeek(-1)}>
              Previous week
            </button>
            <button className="mini-text-button" type="button" onClick={handleThisWeek}>
              This week
            </button>
            <button className="mini-text-button" type="button" onClick={() => handleSwitchWeek(1)}>
              Next week
            </button>
          </div>

          {canPlan ? (
            <button
              className="btn btn-primary"
              type="button"
              onClick={() => setIsAddingPlan((current) => !current)}
            >
              {isAddingPlan ? "Close form" : "+ Add plan"}
            </button>
          ) : null}

          {canSaveWeeks ? (
            <Link className="btn btn-secondary" href="/dashboard/weeks">
              Saved weeks
            </Link>
          ) : null}

          {canPlan ? (
            <button className="btn btn-secondary" type="button" onClick={handleClearWeek}>
              Clear week
            </button>
          ) : null}
        </div>
      </section>

      {savedMessage ? (
        <div className="planner-save-message-row">
          <p className="planner-save-message">{savedMessage}</p>
          {savedMessage.startsWith("Week saved") && canPlan ? (
            <button className="mini-text-button" type="button" onClick={handleStartFreshWeek}>
              Start fresh week
            </button>
          ) : null}
        </div>
      ) : null}

      {isAddingPlan && canPlan ? (
        <section className="planner-add-row planner-add-row-open">
          <AddPlanForm
            childProfiles={children}
            categories={categories}
            weekStart={weekRange.weekStart}
            onAddPlans={handleAddPlans}
            onAddCategory={handleAddCategory}
          />
        </section>
      ) : null}

      <section className="planner-tools-row planner-tools-row-calm">
        <ChildSelector
          childProfiles={visibleChildren}
          activeChildId={isChildView && accountContext?.session.childId ? accountContext.session.childId : activeChildId}
          onChange={setActiveChildId}
          onAddChild={canManageChildren ? handleAddChild : undefined}
          onRenameChild={canManageChildren ? handleRenameChild : undefined}
          onDeleteChild={canManageChildren ? handleDeleteChild : undefined}
        />

        {canSaveWeeks ? (
          <SaveWeekPanel
            plans={plans}
            childProfiles={children}
            weekLabel={weekRange.weekLabel}
            weekStart={weekRange.weekStart}
            weekEnd={weekRange.weekEnd}
            onSaveWeek={handleSaveWeek}
          />
        ) : (
          <div className="week-save-card child-limited-card">
            <p className="eyebrow">Limited child login</p>
            <h3>Parent tools are hidden here.</h3>
            <p className="text-small">
              This login can help mark work done and add notes, but saving weeks,
              adding plans, and managing children stay with the parent account.
            </p>
          </div>
        )}
      </section>

      <section className="planner-board-row">
        <WeeklyPlannerBoard
          plans={visiblePlans}
          childProfiles={children}
          categories={categories}
          weekLabel={weekRange.weekLabel}
          canEditStructure={canPlan}
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
