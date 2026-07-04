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
  updatePlanProgress,
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

  async function loadWorkspace(weekStart = getActiveWeekStart()) {
    const context = await getActiveAccountContext();
    const [nextPlans, nextChildren, nextCategories] = await Promise.all([
      getPlansForWeek(weekStart),
      getChildren(),
      getCategoryDefinitions(),
    ]);

    setAccountContext(context);
    setActiveWeekStart(weekStart);
    setPlans(nextPlans);
    setChildren(nextChildren);
    setCategories(nextCategories);
    setActiveChildId(context?.isChild && context.session.childId ? context.session.childId : "all");
    setHasLoaded(true);
  }

  useEffect(() => {
    let isMounted = true;

    async function initialLoad() {
      if (!isMounted) return;
      await loadWorkspace();
    }

    void initialLoad();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    async function refreshContext() {
      setAccountContext(await getActiveAccountContext());
    }

    window.addEventListener("softweek-session-changed", refreshContext);
    return () => window.removeEventListener("softweek-session-changed", refreshContext);
  }, []);

  useEffect(() => {
    if (!hasLoaded || !activeWeekStart || isChildView) return;
    void savePlansForWeek(activeWeekStart, plans);
  }, [plans, activeWeekStart, hasLoaded, isChildView]);

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

  async function reloadWeek(weekStart: string) {
    setActiveWeekStart(weekStart);
    saveActiveWeekStart(weekStart);
    setPlans(await getPlansForWeek(weekStart));
    setActiveChildId(isChildView && accountContext?.session.childId ? accountContext.session.childId : "all");
    setIsAddingPlan(false);
  }

  async function handleSwitchWeek(direction: number) {
    if (!activeWeekStart) return;

    if (!isChildView) await savePlansForWeek(activeWeekStart, plans);
    const nextWeekStart = shiftWeekStart(activeWeekStart, direction);
    await reloadWeek(nextWeekStart);
    setSavedMessage(direction > 0 ? "Next week opened." : "Previous week opened.");
  }

  async function handleThisWeek() {
    if (!activeWeekStart) return;

    if (!isChildView) await savePlansForWeek(activeWeekStart, plans);
    await reloadWeek(getCurrentWeekRange().weekStart);
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

  function handleCopyPlan(id: string, day: WeekDay) {
    if (!canPlan) return;

    setPlans((current) => {
      const original = current.find((plan) => plan.id === id);
      if (!original) return current;

      const copiedPlan: PlannerItem = {
        ...original,
        id: createId("plan"),
        day,
        status: "planned",
        weekStart: activeWeekStart || original.weekStart,
        actualNotes: "",
      };

      return [copiedPlan, ...current];
    });

    setSavedMessage(`Copied to ${day}.`);
  }

  function handleStatusChange(id: string, status: PlanStatus) {
    setPlans((current) =>
      current.map((plan) => (plan.id === id ? { ...plan, status } : plan))
    );

    void updatePlanProgress({ id, status });
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

    void updatePlanProgress({ id, actualNotes: value });
    setSavedMessage("");
  }

  function handleResourceChange(
    id: string,
    values: { resourceTitle?: string; resourceUrl?: string }
  ) {
    if (!canPlan) return;

    setPlans((current) =>
      current.map((plan) =>
        plan.id === id
          ? {
              ...plan,
              ...values,
            }
          : plan
      )
    );

    setSavedMessage("");
  }

  function handleDelete(id: string) {
    if (!canPlan) return;

    setPlans((current) => current.filter((plan) => plan.id !== id));
    setSavedMessage("");
  }

  async function handleClearWeek() {
    if (!activeWeekStart || !canPlan) return;

    await clearPlansForWeek(activeWeekStart);
    setPlans([]);
    setActiveChildId("all");
    setSavedMessage(`${weekRange.weekLabel} cleared. You can start fresh whenever you are ready.`);
  }

  async function handleStartFreshWeek() {
    if (!activeWeekStart || !canPlan) return;

    const nextWeekStart = shiftWeekStart(activeWeekStart, 1);

    await clearPlansForWeek(nextWeekStart);
    saveActiveWeekStart(nextWeekStart);
    setActiveWeekStart(nextWeekStart);
    setPlans([]);
    setActiveChildId("all");
    setSavedMessage("Fresh week started.");
    setIsAddingPlan(true);
  }

  async function handleSaveWeek(week: SavedWeekLog) {
    if (!canSaveWeeks) return;

    await saveWeekLog(week);
    setSavedMessage("Week saved. You can start a fresh week or keep editing this one.");
  }

  async function handleAddCategory(name: string) {
    if (!canEditCategories) return categories[0];

    const nextCategory = await addCategoryDefinition(name);

    if (nextCategory) {
      const nextCategories = await getCategoryDefinitions();
      await saveCategoryDefinitions(nextCategories);
      setCategories(nextCategories);
      setSavedMessage(`${nextCategory.label} added as a category.`);
    }

    return nextCategory;
  }

  async function handleAddChild(name: string) {
    if (!canManageChildren) return;

    const realChildCount = children.filter((child) => child.id !== "everyone").length;
    const nextChild: ChildProfile = {
      id: createId("child"),
      name,
      colorLabel: colorLabels[realChildCount % colorLabels.length],
    };

    const nextChildren = [...children, nextChild];
    await saveChildren(nextChildren);
    setChildren(await getChildren());
    setSavedMessage(`${name} added. You can assign plans to them now.`);
  }

  async function handleRenameChild(childId: string, name: string) {
    if (!canManageChildren) return;

    setChildren(await renameChildProfile(childId, name));
    setSavedMessage("Child profile updated.");
  }

  async function handleDeleteChild(childId: string) {
    if (!canManageChildren) return;

    const childName = children.find((child) => child.id === childId)?.name ?? "Child";
    setChildren(await deleteChildProfile(childId));
    setPlans(await getPlansForWeek(activeWeekStart));

    if (activeChildId === childId) {
      setActiveChildId("all");
    }

    setSavedMessage(`${childName} removed from active planning. Existing saved records stay in the account history.`);
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
              ? "Parent controls are limited in this child account."
              : "Open a different week if you want to plan ahead, or keep this week simple."}
          </span>
        </div>

        <div className="planner-control-actions planner-control-actions-expanded">
          <div className="week-switcher">
            <button className="mini-text-button" type="button" onClick={() => void handleSwitchWeek(-1)}>
              Previous week
            </button>
            <button className="mini-text-button" type="button" onClick={() => void handleThisWeek()}>
              This week
            </button>
            <button className="mini-text-button" type="button" onClick={() => void handleSwitchWeek(1)}>
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
            <button className="btn btn-secondary" type="button" onClick={() => void handleClearWeek()}>
              Clear week
            </button>
          ) : null}
        </div>
      </section>

      {savedMessage ? (
        <div className="planner-save-message-row">
          <p className="planner-save-message">{savedMessage}</p>
          {savedMessage.startsWith("Week saved") && canPlan ? (
            <button className="mini-text-button" type="button" onClick={() => void handleStartFreshWeek()}>
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
          onAddChild={canManageChildren ? (name) => void handleAddChild(name) : undefined}
          onRenameChild={canManageChildren ? (childId, name) => void handleRenameChild(childId, name) : undefined}
          onDeleteChild={canManageChildren ? (childId) => void handleDeleteChild(childId) : undefined}
        />

        {canSaveWeeks ? (
          <SaveWeekPanel
            plans={plans}
            childProfiles={children}
            weekLabel={weekRange.weekLabel}
            weekStart={weekRange.weekStart}
            weekEnd={weekRange.weekEnd}
            onSaveWeek={(week) => void handleSaveWeek(week)}
          />
        ) : (
          <div className="week-save-card child-limited-card">
            <p className="eyebrow">Limited child account</p>
            <h3>Parent tools are hidden here.</h3>
            <p className="text-small">
              This account can help mark work done and add notes, but saving weeks,
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
          onCopy={handleCopyPlan}
          onStatusChange={handleStatusChange}
          onCategoryChange={handleCategoryChange}
          onActualNotesChange={handleActualNotesChange}
          onResourceChange={handleResourceChange}
          onDelete={handleDelete}
        />
      </section>
    </div>
  );
}
