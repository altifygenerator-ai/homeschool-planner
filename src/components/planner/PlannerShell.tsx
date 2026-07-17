"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import AddPlanForm from "@/components/planner/AddPlanForm";
import CalendarPlannerView from "@/components/planner/CalendarPlannerView";
import SaveWeekPanel from "@/components/planner/SaveWeekPanel";
import TodayView from "@/components/planner/TodayView";
import {
  addCategoryDefinition,
  clearPlansForWeek,
  deleteWeekTemplate,
  getCategoryDefinitions,
  getChildren,
  getPlansForWeek,
  getWeekTemplates,
  saveActiveWeekStart,
  saveCategoryDefinitions,
  savePlansForWeek,
  saveWeekLog,
  saveWeekTemplate,
  updatePlanProgress,
} from "@/lib/plannerStorage";
import { getActiveAccountContext, type AccountContext } from "@/lib/localAuth";
import {
  getCurrentWeekRange,
  getWeekRangeFromStart,
  getWeekStartIso,
  shiftWeekStart,
} from "@/lib/week";
import { createId } from "@/lib/utils";
import { trackSoftWeekEvent } from "@/lib/usageTracking";
import { generateChildWeeklySummaries } from "@/lib/weeklySummary";
import { dayLabels, weekDays } from "@/data/demoPlans";
import type {
  CategoryDefinition,
  ChildProfile,
  PlanCategory,
  PlannerItem,
  PlanStatus,
  SavedWeekLog,
  WeekDay,
  WeekTemplate,
} from "@/types/planner";

type PlannerView = "today" | "calendar" | "records";
type AutoSaveStatus = "idle" | "waiting" | "saving" | "saved" | "error";

function toDateInputValue(isoDate: string) {
  return isoDate ? isoDate.slice(0, 10) : "";
}

function normalizeWeekStart(weekStart: string) {
  return weekStart.slice(0, 10);
}

function weekStartFromDateInput(value: string) {
  return getWeekStartIso(new Date(`${value}T12:00:00`));
}

function resetPlanForAnotherWeek(
  plan: PlannerItem,
  weekStart: string,
): PlannerItem {
  return {
    ...plan,
    id: createId("plan"),
    weekStart,
    status: "planned",
    actualNotes: "",
  };
}

function dayFromDate(value: Date): WeekDay {
  const jsDay = value.getDay();
  const index = jsDay === 0 ? 6 : jsDay - 1;
  return weekDays[index] ?? "Monday";
}

function defaultFocusDayForWeek(weekStart: string): WeekDay {
  const today = new Date();
  const todayWeekStart = getWeekStartIso(today);
  return normalizeWeekStart(todayWeekStart) === normalizeWeekStart(weekStart)
    ? dayFromDate(today)
    : "Monday";
}

function stableWeekRecordId(weekStart: string) {
  return `week-record-${normalizeWeekStart(weekStart)}`;
}

function saveStatusText(status: AutoSaveStatus, hasPlans: boolean) {
  if (!hasPlans)
    return "Add something and SoftWeek will save the record automatically.";
  if (status === "waiting") return "Changes waiting to save...";
  if (status === "saving") return "Saving record...";
  if (status === "saved") return "All changes saved.";
  if (status === "error") return "Could not auto-save. Try Update record now.";
  return "SoftWeek saves this week as you plan.";
}

export default function PlannerShell() {
  const [plans, setPlans] = useState<PlannerItem[]>([]);
  const [children, setChildren] = useState<ChildProfile[]>([]);
  const [categories, setCategories] = useState<CategoryDefinition[]>([]);
  const [templates, setTemplates] = useState<WeekTemplate[]>([]);
  const [activeChildId, setActiveChildId] = useState("all");
  const [activeWeekStart, setActiveWeekStart] = useState("");
  const [focusedDay, setFocusedDay] = useState<WeekDay>("Monday");
  const [plannerView, setPlannerView] = useState<PlannerView>("today");
  const [hasLoaded, setHasLoaded] = useState(false);
  const [isLoadingWeek, setIsLoadingWeek] = useState(false);
  const [savedMessage, setSavedMessage] = useState("");
  const [autoSaveStatus, setAutoSaveStatus] = useState<AutoSaveStatus>("idle");
  const [isAddingPlan, setIsAddingPlan] = useState(false);
  const [addPlanDays, setAddPlanDays] = useState<WeekDay[]>(["Monday"]);
  const [addPlanKey, setAddPlanKey] = useState(0);
  const [accountContext, setAccountContext] = useState<AccountContext | null>(
    null,
  );
  const [jumpDate, setJumpDate] = useState("");
  const [copyDate, setCopyDate] = useState("");
  const [templateName, setTemplateName] = useState("");
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const addPlanPanelRef = useRef<HTMLElement | null>(null);

  const isChildView = accountContext?.isChild ?? false;
  const canPlan = accountContext?.account.permissions.canPlan ?? true;
  const canSaveWeeks = accountContext?.account.permissions.canSaveWeeks ?? true;
  const canEditCategories =
    accountContext?.account.permissions.canEditCategories ?? true;

  async function loadWorkspace(weekStart = getCurrentWeekRange().weekStart) {
    const context = await getActiveAccountContext();
    const [nextPlans, nextChildren, nextCategories, nextTemplates] =
      await Promise.all([
        getPlansForWeek(weekStart),
        getChildren(),
        getCategoryDefinitions(),
        getWeekTemplates(),
      ]);

    setAccountContext(context);
    setActiveWeekStart(weekStart);
    setFocusedDay(defaultFocusDayForWeek(weekStart));
    setJumpDate(toDateInputValue(weekStart));
    setCopyDate(toDateInputValue(shiftWeekStart(weekStart, 1)));
    setPlans(nextPlans);
    setChildren(nextChildren);
    setCategories(nextCategories);
    setTemplates(nextTemplates);
    setSelectedTemplateId(nextTemplates[0]?.id ?? "");
    setActiveChildId(
      context?.isChild && context.session.childId
        ? context.session.childId
        : "all",
    );
    setPlannerView("today");
    setHasLoaded(true);
  }

  useEffect(() => {
    let isMounted = true;

    async function initialLoad() {
      if (!isMounted) return;
      await loadWorkspace(getCurrentWeekRange().weekStart);
      void trackSoftWeekEvent("planner_opened", { source: "planner" });
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
    return () =>
      window.removeEventListener("softweek-session-changed", refreshContext);
  }, []);

  useEffect(() => {
    if (!hasLoaded || !activeWeekStart || isChildView || isLoadingWeek) return;
    void savePlansForWeek(activeWeekStart, plans);
  }, [plans, activeWeekStart, hasLoaded, isChildView, isLoadingWeek]);

  const weekRange = useMemo(() => {
    return activeWeekStart
      ? getWeekRangeFromStart(activeWeekStart)
      : getCurrentWeekRange();
  }, [activeWeekStart]);

  const visibleChildren = useMemo(() => {
    if (!isChildView || !accountContext?.session.childId) return children;

    return children.filter(
      (child) =>
        child.id === "everyone" || child.id === accountContext.session.childId,
    );
  }, [accountContext, children, isChildView]);

  const visiblePlans = useMemo(() => {
    if (isChildView && accountContext?.session.childId) {
      return plans.filter(
        (plan) =>
          plan.assignedTo === accountContext.session.childId ||
          plan.assignedTo === "everyone",
      );
    }

    if (activeChildId === "all") return plans;

    return plans.filter(
      (plan) =>
        plan.assignedTo === activeChildId || plan.assignedTo === "everyone",
    );
  }, [accountContext, activeChildId, isChildView, plans]);

  const selectedTemplate = useMemo(() => {
    return templates.find((template) => template.id === selectedTemplateId);
  }, [selectedTemplateId, templates]);

  function buildWeekRecord(currentPlans = plans): SavedWeekLog {
    return {
      id: stableWeekRecordId(weekRange.weekStart),
      weekLabel: weekRange.weekLabel,
      weekStart: weekRange.weekStart,
      weekEnd: weekRange.weekEnd,
      savedAt: new Date().toISOString(),
      children,
      plans: currentPlans,
      childSummaries: generateChildWeeklySummaries(children, currentPlans),
    };
  }

  useEffect(() => {
    if (
      !hasLoaded ||
      !activeWeekStart ||
      isChildView ||
      isLoadingWeek ||
      !canSaveWeeks
    )
      return;

    if (!plans.length) {
      const idleTimer = window.setTimeout(() => setAutoSaveStatus("idle"), 0);
      return () => window.clearTimeout(idleTimer);
    }

    const waitingTimer = window.setTimeout(
      () => setAutoSaveStatus("waiting"),
      0,
    );
    const timer = window.setTimeout(() => {
      const record: SavedWeekLog = {
        id: stableWeekRecordId(weekRange.weekStart),
        weekLabel: weekRange.weekLabel,
        weekStart: weekRange.weekStart,
        weekEnd: weekRange.weekEnd,
        savedAt: new Date().toISOString(),
        children,
        plans,
        childSummaries: generateChildWeeklySummaries(children, plans),
      };

      setAutoSaveStatus("saving");
      saveWeekLog(record)
        .then(() => setAutoSaveStatus("saved"))
        .catch(() => setAutoSaveStatus("error"));
    }, 1200);

    return () => {
      window.clearTimeout(waitingTimer);
      window.clearTimeout(timer);
    };
  }, [
    plans,
    children,
    weekRange.weekStart,
    weekRange.weekEnd,
    weekRange.weekLabel,
    hasLoaded,
    activeWeekStart,
    isChildView,
    isLoadingWeek,
    canSaveWeeks,
  ]);

  function openAddPlanForDay(day: WeekDay) {
    if (!canPlan) return;

    setPlannerView("calendar");
    setAddPlanDays([day]);
    setAddPlanKey((current) => current + 1);
    setIsAddingPlan(true);

    window.setTimeout(() => {
      addPlanPanelRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 80);
  }

  async function reloadWeek(weekStart: string) {
    setIsLoadingWeek(true);

    try {
      const nextPlans = await getPlansForWeek(weekStart);

      saveActiveWeekStart(weekStart);
      setActiveWeekStart(weekStart);
      setFocusedDay(defaultFocusDayForWeek(weekStart));
      setJumpDate(toDateInputValue(weekStart));
      setCopyDate(toDateInputValue(shiftWeekStart(weekStart, 1)));
      setPlans(nextPlans);
      setActiveChildId(
        isChildView && accountContext?.session.childId
          ? accountContext.session.childId
          : "all",
      );
      setIsAddingPlan(false);
      void trackSoftWeekEvent("week_opened", {
        source: "planner",
        metadata: { weekStart },
      });
    } finally {
      setIsLoadingWeek(false);
    }
  }

  async function handleSwitchWeek(direction: number) {
    if (!activeWeekStart) return;

    if (!isChildView) await savePlansForWeek(activeWeekStart, plans);
    const nextWeekStart = shiftWeekStart(activeWeekStart, direction);
    await reloadWeek(nextWeekStart);
    setSavedMessage(
      direction > 0 ? "Next week opened." : "Previous week opened.",
    );
  }

  async function handleThisWeek() {
    if (!activeWeekStart) return;

    if (!isChildView) await savePlansForWeek(activeWeekStart, plans);
    await reloadWeek(getCurrentWeekRange().weekStart);
    setSavedMessage("Current week opened.");
  }

  async function handlePickWeek() {
    if (!jumpDate || !canPlan) return;

    if (!isChildView && activeWeekStart)
      await savePlansForWeek(activeWeekStart, plans);
    const pickedWeekStart = weekStartFromDateInput(jumpDate);
    await reloadWeek(pickedWeekStart);
    setSavedMessage(
      `Opened week of ${getWeekRangeFromStart(pickedWeekStart).weekLabel}.`,
    );
  }

  function handleAddPlans(newPlans: PlannerItem[]) {
    if (!canPlan) return;

    setPlans((current) => [...newPlans, ...current]);
    setSavedMessage("Added. SoftWeek will save the record automatically.");
    setIsAddingPlan(false);
    setFocusedDay(newPlans[0]?.day ?? focusedDay);
    void trackSoftWeekEvent("plan_added", {
      source: "planner",
      metadata: { count: newPlans.length, weekStart: activeWeekStart },
    });
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
          : plan,
      ),
    );

    setSavedMessage("");
    setFocusedDay(day);
    void trackSoftWeekEvent("plan_moved", {
      source: "planner",
      metadata: { day, weekStart: activeWeekStart },
    });
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

    setSavedMessage(`Copied to ${dayLabels[day]}.`);
    setFocusedDay(day);
    void trackSoftWeekEvent("plan_copied", {
      source: "planner",
      metadata: { day, weekStart: activeWeekStart },
    });
  }

  function handleStatusChange(id: string, status: PlanStatus) {
    setPlans((current) =>
      current.map((plan) => (plan.id === id ? { ...plan, status } : plan)),
    );

    void updatePlanProgress({ id, status });
    setSavedMessage("");
    void trackSoftWeekEvent("plan_status_updated", {
      source: "planner",
      metadata: { status, weekStart: activeWeekStart },
    });
  }

  function handleCategoryChange(id: string, category: PlanCategory) {
    if (!canPlan) return;

    setPlans((current) =>
      current.map((plan) => (plan.id === id ? { ...plan, category } : plan)),
    );

    setSavedMessage("");
  }

  function handleActualNotesChange(id: string, value: string) {
    setPlans((current) =>
      current.map((plan) =>
        plan.id === id ? { ...plan, actualNotes: value } : plan,
      ),
    );

    void updatePlanProgress({ id, actualNotes: value });
    setSavedMessage("");
  }

  function handleResourceChange(
    id: string,
    values: { resourceTitle?: string; resourceUrl?: string },
  ) {
    if (!canPlan) return;

    setPlans((current) =>
      current.map((plan) =>
        plan.id === id
          ? {
              ...plan,
              ...values,
            }
          : plan,
      ),
    );

    setSavedMessage("");
    void trackSoftWeekEvent("resource_updated", {
      source: "planner",
      metadata: {
        hasResourceUrl: Boolean(values.resourceUrl),
        weekStart: activeWeekStart,
      },
    });
  }

  function handleDelete(id: string) {
    if (!canPlan) return;

    const deletedPlan = plans.find((plan) => plan.id === id);

    setPlans((current) => current.filter((plan) => plan.id !== id));
    setSavedMessage("");

    if (deletedPlan) {
      void trackSoftWeekEvent("plan_deleted", {
        source: "planner",
        metadata: {
          day: deletedPlan.day,
          weekStart: activeWeekStart,
        },
      });
    }
  }

  async function handleClearWeek() {
    if (!activeWeekStart || !canPlan) return;

    await clearPlansForWeek(activeWeekStart);
    setPlans([]);
    setActiveChildId("all");
    setSavedMessage(
      `${weekRange.weekLabel} cleared. You can start fresh whenever you are ready.`,
    );
    void trackSoftWeekEvent("week_opened", {
      source: "planner",
      metadata: { action: "cleared", weekStart: activeWeekStart },
    });
  }

  async function handleStartFreshWeek() {
    if (!activeWeekStart || !canPlan) return;

    const nextWeekStart = shiftWeekStart(activeWeekStart, 1);

    await clearPlansForWeek(nextWeekStart);
    await reloadWeek(nextWeekStart);
    setPlannerView("calendar");
    setSavedMessage("Fresh week started.");
    openAddPlanForDay(defaultFocusDayForWeek(nextWeekStart));
  }

  async function handleCopyWeekToDate(dateValue = copyDate) {
    if (!activeWeekStart || !dateValue || !plans.length || !canPlan) return;

    const targetWeekStart = weekStartFromDateInput(dateValue);
    const targetLabel = getWeekRangeFromStart(targetWeekStart).weekLabel;

    if (targetWeekStart.slice(0, 10) === activeWeekStart.slice(0, 10)) {
      setSavedMessage("Pick a different week before copying this week.");
      return;
    }

    await savePlansForWeek(activeWeekStart, plans);
    const targetPlans = await getPlansForWeek(targetWeekStart);
    const copiedPlans = plans.map((plan) =>
      resetPlanForAnotherWeek(plan, targetWeekStart),
    );
    const mergedTargetPlans = [...copiedPlans, ...targetPlans];
    await savePlansForWeek(targetWeekStart, mergedTargetPlans);

    const targetRange = getWeekRangeFromStart(targetWeekStart);
    await saveWeekLog({
      id: stableWeekRecordId(targetWeekStart),
      weekLabel: targetRange.weekLabel,
      weekStart: targetRange.weekStart,
      weekEnd: targetRange.weekEnd,
      savedAt: new Date().toISOString(),
      children,
      plans: mergedTargetPlans,
      childSummaries: generateChildWeeklySummaries(children, mergedTargetPlans),
    });

    setSavedMessage(
      `Copied ${copiedPlans.length} item${copiedPlans.length === 1 ? "" : "s"} to ${targetLabel}.`,
    );
    void trackSoftWeekEvent("week_copied", {
      source: "planner",
      metadata: {
        count: copiedPlans.length,
        fromWeekStart: activeWeekStart,
        targetWeekStart,
      },
    });
  }

  async function handleSaveTemplate() {
    if (!plans.length || !canPlan) return;

    const name = templateName.trim() || `${weekRange.weekLabel} rhythm`;
    const template: WeekTemplate = {
      id: createId("template"),
      name,
      createdAt: new Date().toISOString(),
      plans: plans.map((plan) => ({
        ...plan,
        status: "planned",
        actualNotes: "",
        weekStart: undefined,
      })),
    };

    await saveWeekTemplate(template);
    const nextTemplates = await getWeekTemplates();
    setTemplates(nextTemplates);
    setSelectedTemplateId(template.id);
    setTemplateName("");
    setIsSavingTemplate(false);
    setSavedMessage(`${name} saved as a reusable week template.`);
    void trackSoftWeekEvent("template_saved", {
      source: "planner",
      metadata: { planCount: template.plans.length },
    });
  }

  function handleUseTemplate() {
    if (!selectedTemplate || !canPlan || !activeWeekStart) return;

    const copiedPlans = selectedTemplate.plans.map((plan) =>
      resetPlanForAnotherWeek(plan, activeWeekStart),
    );
    setPlans((current) => [...copiedPlans, ...current]);
    setSavedMessage(`${selectedTemplate.name} added to this week.`);
    setPlannerView("calendar");
    void trackSoftWeekEvent("template_used", {
      source: "planner",
      metadata: { planCount: copiedPlans.length, weekStart: activeWeekStart },
    });
  }

  async function handleDeleteTemplate() {
    if (!selectedTemplate || !canPlan) return;

    await deleteWeekTemplate(selectedTemplate.id);
    const nextTemplates = await getWeekTemplates();
    setTemplates(nextTemplates);
    setSelectedTemplateId(nextTemplates[0]?.id ?? "");
    setSavedMessage(`${selectedTemplate.name} removed from templates.`);
    void trackSoftWeekEvent("template_deleted", {
      source: "planner",
    });
  }

  async function handleSaveWeek(week?: SavedWeekLog) {
    if (!canSaveWeeks) return;

    const record = week ?? buildWeekRecord(plans);
    await saveWeekLog({ ...record, id: stableWeekRecordId(record.weekStart) });
    setAutoSaveStatus("saved");
    setSavedMessage("Record updated. You can keep editing this week anytime.");
    void trackSoftWeekEvent("week_saved", {
      source: "planner",
      metadata: { weekStart: record.weekStart, planCount: record.plans.length },
    });
  }

  async function handleAddCategory(name: string) {
    if (!canEditCategories) return categories[0];

    const nextCategory = await addCategoryDefinition(name);

    if (nextCategory) {
      const nextCategories = await getCategoryDefinitions();
      await saveCategoryDefinitions(nextCategories);
      setCategories(nextCategories);
      setSavedMessage(`${nextCategory.label} added as a category.`);
      void trackSoftWeekEvent("category_added", {
        source: "planner",
      });
    }

    return nextCategory;
  }

  async function handleOpenTodayView() {
    const currentWeekStart = getCurrentWeekRange().weekStart;

    if (
      activeWeekStart &&
      normalizeWeekStart(activeWeekStart) !==
        normalizeWeekStart(currentWeekStart)
    ) {
      if (!isChildView) await savePlansForWeek(activeWeekStart, plans);
      await reloadWeek(currentWeekStart);
    }

    setFocusedDay(dayFromDate(new Date()));
    setPlannerView("today");
    setIsAddingPlan(false);
  }

  function handleOpenCalendarView() {
    setPlannerView("calendar");
    setIsAddingPlan(false);
  }

  function handleSelectCalendarDay(day: WeekDay) {
    setFocusedDay(day);
    setIsAddingPlan(false);
  }

  return (
    <div className="planner-workspace planner-workspace-calm planner-workspace-redesigned planner-workspace-calendar-simple">
      <section className="planner-page-heading planner-page-heading-calm planner-page-heading-simple">
        <div>
          <p className="eyebrow">
            {isChildView ? "Child view" : "SoftWeek planner"}
          </p>

          <h1 className="section-title">
            {isChildView
              ? "Today first, then the calendar if you need it."
              : "Today when you open it. Calendar when you plan."}
          </h1>

          <p className="section-lead">
            {isChildView
              ? "This view keeps the child side simple: see what is assigned, mark what happened, and leave the main plan alone."
              : "SoftWeek is set up around a simple flow now: check today, click a day on the calendar, add what belongs there, and let the record save in the background."}
          </p>
        </div>
      </section>

      <nav
        className="planner-view-tabs planner-view-tabs-simple"
        aria-label="Planner views"
      >
        <button
          className={plannerView === "today" ? "is-active" : ""}
          type="button"
          onClick={() => void handleOpenTodayView()}
        >
          Today
        </button>
        <button
          className={plannerView === "calendar" ? "is-active" : ""}
          type="button"
          onClick={handleOpenCalendarView}
        >
          Calendar
        </button>
        {!isChildView ? (
          <button
            className={plannerView === "records" ? "is-active" : ""}
            type="button"
            onClick={() => {
              setPlannerView("records");
              setIsAddingPlan(false);
            }}
          >
            Records
          </button>
        ) : null}
      </nav>

      <section className="planner-quiet-status soft-card">
        <div>
          <p className="control-kicker">Week of {weekRange.weekLabel}</p>
          <span>{saveStatusText(autoSaveStatus, plans.length > 0)}</span>
        </div>
        {canSaveWeeks ? (
          <Link className="mini-text-button" href="/dashboard/weeks">
            Saved records
          </Link>
        ) : null}
      </section>

      {savedMessage ? (
        <div className="planner-save-message-row">
          <p className="planner-save-message">{savedMessage}</p>
          {savedMessage.startsWith("Record updated") && canPlan ? (
            <button
              className="mini-text-button"
              type="button"
              onClick={() => void handleStartFreshWeek()}
            >
              Start fresh week
            </button>
          ) : null}
        </div>
      ) : null}

      {plannerView === "today" ? (
        <TodayView
          plans={plans}
          childProfiles={visibleChildren}
          categories={categories}
          weekStart={weekRange.weekStart}
          focusedDay={focusedDay}
          activeChildId={
            isChildView && accountContext?.session.childId
              ? accountContext.session.childId
              : activeChildId
          }
          isChildView={isChildView}
          onDayChange={setFocusedDay}
          onChildChange={setActiveChildId}
          onStatusChange={handleStatusChange}
          onActualNotesChange={handleActualNotesChange}
          onOpenCalendar={canPlan ? handleOpenCalendarView : undefined}
          showDayPicker={false}
        />
      ) : null}

      {plannerView === "calendar" ? (
        <CalendarPlannerView
          plans={visiblePlans}
          childProfiles={visibleChildren}
          categories={categories}
          weekLabel={weekRange.weekLabel}
          weekStart={weekRange.weekStart}
          selectedDay={focusedDay}
          activeChildId={
            isChildView && accountContext?.session.childId
              ? accountContext.session.childId
              : activeChildId
          }
          isChildView={isChildView}
          canEditStructure={canPlan}
          jumpDate={jumpDate}
          isAddingPlan={isAddingPlan}
          addPlanSlot={
            canPlan ? (
              <section
                ref={addPlanPanelRef}
                className="planner-add-row planner-add-row-open calendar-add-row-inline"
              >
                <AddPlanForm
                  key={addPlanKey}
                  childProfiles={children}
                  categories={categories}
                  weekStart={weekRange.weekStart}
                  initialDays={addPlanDays}
                  titlePrefix={`Add something to ${dayLabels[focusedDay]}.`}
                  onAddPlans={handleAddPlans}
                  onAddCategory={handleAddCategory}
                  onCancel={() => setIsAddingPlan(false)}
                />
              </section>
            ) : null
          }
          onSelectDay={handleSelectCalendarDay}
          onChildChange={setActiveChildId}
          onAddToDay={openAddPlanForDay}
          onSwitchWeek={(direction) => void handleSwitchWeek(direction)}
          onThisWeek={() => void handleThisWeek()}
          onJumpDateChange={setJumpDate}
          onPickWeek={() => void handlePickWeek()}
          onMove={handleMove}
          onCopy={handleCopyPlan}
          onStatusChange={handleStatusChange}
          onCategoryChange={handleCategoryChange}
          onActualNotesChange={handleActualNotesChange}
          onResourceChange={handleResourceChange}
          onDelete={handleDelete}
        />
      ) : null}

      {plannerView === "records" && canPlan ? (
        <section className="planner-tools-page planner-records-page-simple">
          <div className="planner-tools-row planner-tools-row-calm planner-record-row">
            {canSaveWeeks ? (
              <SaveWeekPanel
                plans={plans}
                childProfiles={children}
                weekLabel={weekRange.weekLabel}
                weekStart={weekRange.weekStart}
                weekEnd={weekRange.weekEnd}
                onSaveWeek={(week) => void handleSaveWeek(week)}
              />
            ) : null}

            <div className="week-save-card child-limited-card planner-week-note-card">
              <p className="eyebrow">Saved records</p>
              <h3>Your week stays editable.</h3>
              <p className="text-small">
                Auto-save keeps updating this week’s record. You can still
                change plans, mark things done, and update notes anytime.
              </p>
              <Link
                className="soft-action soft-action-filled"
                href="/dashboard/weeks"
              >
                Open saved records
              </Link>
            </div>
          </div>

          <details className="planner-more-tools soft-card">
            <summary>
              <span>More planning tools</span>
              <small>Copy weeks, save templates, or clear the week</small>
            </summary>

            <div className="planner-advanced-grid planner-advanced-grid-simple planner-more-tools-grid">
              <div className="planner-tool-card planner-tool-primary">
                <span>Open another week</span>
                <p className="planner-tool-note">
                  Jump to any week when you want to plan ahead or look back.
                </p>

                <label className="mini-field">
                  <span>Pick any date in the week</span>
                  <input
                    type="date"
                    value={jumpDate}
                    onChange={(event) => setJumpDate(event.target.value)}
                  />
                </label>

                <button
                  className="soft-action soft-action-filled"
                  type="button"
                  onClick={() => void handlePickWeek()}
                >
                  Open picked week
                </button>

                <div className="planner-tool-divider" />

                <button
                  className="soft-action"
                  type="button"
                  onClick={() => setIsSavingTemplate((current) => !current)}
                  disabled={!plans.length}
                >
                  Save this week as a template
                </button>

                {isSavingTemplate ? (
                  <div className="template-inline-form">
                    <label className="mini-field">
                      <span>Template name</span>
                      <input
                        value={templateName}
                        placeholder="Normal week, co-op week, light week..."
                        onChange={(event) =>
                          setTemplateName(event.target.value)
                        }
                      />
                    </label>

                    <div className="template-inline-actions">
                      <button
                        className="soft-action soft-action-filled"
                        type="button"
                        onClick={() => void handleSaveTemplate()}
                        disabled={!plans.length}
                      >
                        Save template
                      </button>
                      <button
                        className="mini-text-button"
                        type="button"
                        onClick={() => {
                          setTemplateName("");
                          setIsSavingTemplate(false);
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="planner-tool-card">
                <span>Copy this week</span>
                <p className="planner-tool-note">
                  Reuse this week somewhere else without changing the week you
                  are on now.
                </p>

                <button
                  className="soft-action soft-action-filled"
                  type="button"
                  onClick={() =>
                    void handleCopyWeekToDate(
                      toDateInputValue(shiftWeekStart(activeWeekStart, 1)),
                    )
                  }
                  disabled={!plans.length}
                >
                  Copy to next week
                </button>

                <label className="mini-field">
                  <span>Or copy to week of</span>
                  <input
                    type="date"
                    value={copyDate}
                    onChange={(event) => setCopyDate(event.target.value)}
                  />
                </label>

                <button
                  className="soft-action"
                  type="button"
                  onClick={() => void handleCopyWeekToDate()}
                  disabled={!plans.length}
                >
                  Copy to picked week
                </button>
              </div>

              <div className="planner-tool-card">
                <span>Use a template</span>
                <p className="planner-tool-note">
                  Start this week from a saved rhythm instead of rebuilding it
                  by hand.
                </p>

                {templates.length ? (
                  <div className="template-use-row template-use-row-simple">
                    <label className="mini-field">
                      <span>Saved templates</span>
                      <select
                        value={selectedTemplateId}
                        onChange={(event) =>
                          setSelectedTemplateId(event.target.value)
                        }
                      >
                        {templates.map((template) => (
                          <option key={template.id} value={template.id}>
                            {template.name} - {template.plans.length} items
                          </option>
                        ))}
                      </select>
                    </label>

                    <div className="template-inline-actions">
                      <button
                        className="soft-action soft-action-filled"
                        type="button"
                        onClick={handleUseTemplate}
                      >
                        Add template to this week
                      </button>
                      <button
                        className="mini-text-button"
                        type="button"
                        onClick={() => void handleDeleteTemplate()}
                      >
                        Delete template
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="template-empty-note">
                    No templates yet. Save a week as a template when you have a
                    rhythm you want to reuse.
                  </p>
                )}
              </div>
            </div>

            <div className="planner-clear-row">
              <button
                className="mini-text-button"
                type="button"
                onClick={() => void handleClearWeek()}
              >
                Clear this week
              </button>
            </div>
          </details>
        </section>
      ) : null}
    </div>
  );
}
