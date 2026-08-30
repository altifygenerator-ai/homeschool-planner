"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import TodayScreen from "@/components/planner/redesign/TodayScreen";
import WeekScreen from "@/components/planner/redesign/WeekScreen";
import CourseScreen from "@/components/planner/redesign/CourseScreen";
import LifeHappenedDialog from "@/components/planner/redesign/LifeHappenedDialog";
import WeeklyRhythmEditor from "@/components/planner/redesign/WeeklyRhythmEditor";
import WeekCloseout from "@/components/planner/redesign/WeekCloseout";
import PwaInstallPrompt from "@/components/pwa/PwaInstallPrompt";
import { getChildren, saveWeekLog } from "@/lib/plannerStorage";
import {
  bulkMovePlannerItems,
  completePlannerItem,
  createPlannerItem,
  deletePlannerItem,
  movePlannerItem,
  readLessonStacks,
  readPlannerWeek,
  readWeeklyRhythms,
  replayOfflinePlannerChanges,
  restorePlannerItem,
  saveLessonStack,
  saveWeeklyRhythm,
  skipPlannerItem,
  updatePlannerItem,
} from "@/lib/plannerRepository";
import { getActiveAccountContext, type AccountContext } from "@/lib/localAuth";
import { applyRecoveryChanges, courseRhythmId, dayForDate, generateCourseLessonItems, generateRhythmItems, isCourseRhythm, type RecoveryChange, type RecoveryMode } from "@/lib/plannerLogic";
import { createId } from "@/lib/utils";
import { getCurrentWeekRange, getWeekRangeFromStart, shiftWeekStart } from "@/lib/week";
import { generateChildWeeklySummaries } from "@/lib/weeklySummary";
import { trackSoftWeekEvent } from "@/lib/usageTracking";
import type { ChildProfile, LessonStack, PlannerItem, SavedWeekLog, WeekDay, WeeklyRhythm } from "@/types/planner";

type PlannerView = "today" | "courses" | "week";
type SyncStatus = "saved" | "saving" | "offline" | "error";

type UndoState = {
  label: string;
  run: () => Promise<void>;
};

function stableWeekRecordId(weekStart: string) {
  return `week-record-${weekStart.slice(0, 10)}`;
}

function currentDateKey() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function normalizeItem(item: PlannerItem, weekStart: string): PlannerItem {
  return {
    ...item,
    day: item.day ?? null,
    placement: item.placement ?? (item.day ? "day" : "week"),
    weekStart,
    orderIndex: item.orderIndex ?? 0,
    syncState: item.syncState ?? "saved",
  };
}

function withoutSyncState(plan: PlannerItem): Omit<PlannerItem, "syncState"> {
  const copy = { ...plan };
  delete copy.syncState;
  return copy;
}

type PlannerShellProps = {
  initialView?: PlannerView;
  initialAdd?: boolean;
  initialCloseout?: boolean;
  initialReminder?: string | null;
};

export default function PlannerShell({
  initialView = "today",
  initialAdd = false,
  initialCloseout = false,
  initialReminder = null,
}: PlannerShellProps) {
  const [view, setView] = useState<PlannerView>(initialView);
  const [plans, setPlans] = useState<PlannerItem[]>([]);
  const [children, setChildren] = useState<ChildProfile[]>([]);
  const [rhythms, setRhythms] = useState<WeeklyRhythm[]>([]);
  const [stacks, setStacks] = useState<LessonStack[]>([]);
  const [account, setAccount] = useState<AccountContext | null>(null);
  const [weekStart, setWeekStart] = useState(getCurrentWeekRange().weekStart);
  const [focusedDay, setFocusedDay] = useState<WeekDay>("Monday");
  const [activeChildId, setActiveChildId] = useState("all");
  const [loading, setLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("saved");
  const [errorMessage, setErrorMessage] = useState("");
  const [recordWarning, setRecordWarning] = useState("");
  const [undo, setUndo] = useState<UndoState | null>(null);
  const [focusToken] = useState(initialAdd ? 1 : 0);
  const [lifeDay, setLifeDay] = useState<WeekDay | undefined>();
  const [lifeOpen, setLifeOpen] = useState(false);
  const [rhythmOpen, setRhythmOpen] = useState(false);
  const [rhythmSource, setRhythmSource] = useState<PlannerItem | null>(null);
  const [closeoutOpen, setCloseoutOpen] = useState(initialCloseout);
  const recordTimer = useRef<number | null>(null);

  const weekRange = useMemo(() => getWeekRangeFromStart(weekStart), [weekStart]);
  const canEdit = account?.isParent ?? false;
  const canMove = canEdit || Boolean(account?.account.permissions.canPlan);

  const loadWeek = useCallback(async (targetWeek: string, knownRhythms?: WeeklyRhythm[], knownStacks?: LessonStack[]) => {
    setLoading(true);
    setErrorMessage("");
    try {
      const nextPlans = (await readPlannerWeek(targetWeek)).map((item) => normalizeItem(item, targetWeek));
      const activeRhythms = knownRhythms ?? await readWeeklyRhythms();
      const activeStacks = knownStacks ?? await readLessonStacks();
      const context = await getActiveAccountContext();
      const generatedRhythms = context?.isParent
        ? generateRhythmItems(activeRhythms, targetWeek, nextPlans, createId)
        : [];

      let savedGenerated: PlannerItem[] = [];
      if (generatedRhythms.length) {
        const results = await Promise.allSettled(generatedRhythms.map((item) => createPlannerItem(item)));
        savedGenerated = results.flatMap((result) => result.status === "fulfilled" ? [result.value] : []);
        const failures = results.length - savedGenerated.length;
        if (savedGenerated.length) {
          void trackSoftWeekEvent("rhythm_applied", { source: "week-load", metadata: { count: savedGenerated.length } });
        }
        if (failures) {
          setErrorMessage(`${failures} rhythm ${failures === 1 ? "item" : "items"} could not be added. The rest of the week still loaded.`);
          setSyncStatus("error");
        }
      }

      const basePlans = [...nextPlans, ...savedGenerated];
      const courseGenerated = context?.isParent
        ? generateCourseLessonItems(activeStacks, activeRhythms, targetWeek, basePlans)
        : [];
      let savedCourseItems: PlannerItem[] = [];
      let nextStacks = activeStacks;

      if (courseGenerated.length) {
        const results = await Promise.allSettled(courseGenerated.map((item) => createPlannerItem(item)));
        savedCourseItems = results.flatMap((result) => result.status === "fulfilled" ? [result.value] : []);
        const savedByLessonId = new Map(savedCourseItems.filter((item) => item.sourceLessonStackItemId).map((item) => [item.sourceLessonStackItemId as string, item]));
        nextStacks = activeStacks.map((stack) => ({
          ...stack,
          items: stack.items.map((lesson) => {
            const generated = savedByLessonId.get(lesson.id);
            return generated ? { ...lesson, status: "planned" as const, plannerItemId: generated.id, completedAt: null } : lesson;
          }),
        }));
        const changedStacks = nextStacks.filter((stack) => activeStacks.some((before) => before.id === stack.id && before.items.some((lesson, index) => lesson !== stack.items[index])));
        if (changedStacks.length) await Promise.allSettled(changedStacks.map((stack) => saveLessonStack(stack)));
        if (savedCourseItems.length) {
          void trackSoftWeekEvent("course_next_surfaced", { source: "today", metadata: { count: savedCourseItems.length } });
        }
        const failures = courseGenerated.length - savedCourseItems.length;
        if (failures) {
          setErrorMessage(`${failures} course ${failures === 1 ? "lesson" : "lessons"} could not be surfaced today. Your course order is still safe.`);
          setSyncStatus("error");
        }
      }

      const combined = [...basePlans, ...savedCourseItems];
      setPlans(combined);
      setStacks(nextStacks);
      if (!combined.length && context?.isParent) void trackSoftWeekEvent("onboarding_started", { source: "empty-planner" });
      setWeekStart(targetWeek);
      const todayDay = dayForDate(targetWeek);
      setFocusedDay(todayDay ?? "Monday");
      if ((!generatedRhythms.length || savedGenerated.length === generatedRhythms.length) && (!courseGenerated.length || savedCourseItems.length === courseGenerated.length)) {
        setSyncStatus(typeof navigator !== "undefined" && !navigator.onLine ? "offline" : "saved");
      }
      void trackSoftWeekEvent("week_opened", { source: "planner", metadata: { weekStart: targetWeek } });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "The week could not be loaded.");
      setSyncStatus("error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    async function start() {
      try {
        const [context, childProfiles, nextRhythms, nextStacks] = await Promise.all([
          getActiveAccountContext(),
          getChildren(),
          readWeeklyRhythms(),
          readLessonStacks(),
        ]);
        if (!mounted) return;
        setAccount(context);
        setChildren(childProfiles);
        setRhythms(nextRhythms);
        setStacks(nextStacks);
        setActiveChildId(context?.isChild && context.session.childId ? context.session.childId : "all");

        if (initialReminder) {
          void trackSoftWeekEvent("reminder_clicked", { source: initialReminder });
        }

        await loadWeek(getCurrentWeekRange().weekStart, nextRhythms, nextStacks);
        void trackSoftWeekEvent("planner_opened", { source: initialView });
        if (initialView === "today") {
          void trackSoftWeekEvent("today_opened", { source: "planner" });
        } else if (initialView === "courses") {
          void trackSoftWeekEvent("course_opened", { source: "planner" });
        }
      } catch (error) {
        if (!mounted) return;
        setErrorMessage(error instanceof Error ? error.message : "SoftWeek could not finish loading your planner.");
        setSyncStatus("error");
        setLoading(false);
      }
    }
    void start();
    return () => { mounted = false; };
  }, [initialReminder, initialView, loadWeek]);

  useEffect(() => {
    async function online() {
      setSyncStatus("saving");
      try {
        const replayed = await replayOfflinePlannerChanges();
        setSyncStatus("saved");
        if (replayed) await loadWeek(weekStart, rhythms, stacks);
      } catch (error) {
        setSyncStatus("error");
        setErrorMessage(error instanceof Error ? error.message : "Offline changes could not be synchronized.");
      }
    }
    function offline() { setSyncStatus("offline"); }
    window.addEventListener("online", online);
    window.addEventListener("offline", offline);
    return () => {
      window.removeEventListener("online", online);
      window.removeEventListener("offline", offline);
    };
  }, [loadWeek, rhythms, stacks, weekStart]);

  useEffect(() => {
    if (loading || account?.isChild || !account) return;
    if (recordTimer.current) window.clearTimeout(recordTimer.current);
    recordTimer.current = window.setTimeout(() => {
      const record: SavedWeekLog = {
        id: stableWeekRecordId(weekStart),
        weekLabel: weekRange.weekLabel,
        weekStart,
        weekEnd: weekRange.weekEnd,
        savedAt: new Date().toISOString(),
        children,
        plans: plans.map(withoutSyncState),
        childSummaries: generateChildWeeklySummaries(children, plans),
      };
      void saveWeekLog(record)
        .then(() => setRecordWarning(""))
        .catch((error) => {
          console.error("SoftWeek automatic weekly record update failed", error);
          const detail = error instanceof Error && error.message
            ? ` ${error.message}`
            : "";
          setRecordWarning(`Your planner changes are saved, but the automatic weekly record could not update.${detail}`);
        });
    }, 900);
    return () => {
      if (recordTimer.current) window.clearTimeout(recordTimer.current);
    };
  }, [account?.isChild, children, loading, plans, weekRange.weekEnd, weekRange.weekLabel, weekStart]);

  async function addPlan(values: Pick<PlannerItem, "title" | "day" | "placement" | "assignedTo" | "timeBlock" | "category" | "notes" | "resourceTitle" | "resourceUrl">) {
    const item: PlannerItem = {
      ...values,
      id: createId("plan"),
      status: "planned",
      weekStart,
      actualNotes: "",
      completedAt: null,
      actualDate: null,
      orderIndex: plans.length,
      syncState: "saving",
    };
    setPlans((current) => [...current, item]);
    setSyncStatus("saving");
    setErrorMessage("");
    try {
      const savedItem = await createPlannerItem(item);
      const queued = savedItem.syncState === "queued" || (typeof navigator !== "undefined" && !navigator.onLine);
      setPlans((current) => current.map((plan) => plan.id === item.id ? { ...plan, syncState: queued ? "queued" : "saved" } : plan));
      setSyncStatus(queued ? "offline" : "saved");
      void trackSoftWeekEvent(values.placement === "week" ? "week_inbox_item_created" : "plan_added", { source: view, metadata: { placement: values.placement } });
      if (values.placement === "day") void trackSoftWeekEvent("first_item_scheduled", { source: view });
      if (plans.length + 1 === 3) void trackSoftWeekEvent("third_item_created", { source: view });
      const marker = window.localStorage.getItem("softweek_first_item_created");
      if (!marker) {
        window.localStorage.setItem("softweek_first_item_created", "1");
        void trackSoftWeekEvent("first_item_created", { source: "planner" });
        void trackSoftWeekEvent("onboarding_completed", { source: "planner" });
      }
    } catch (error) {
      setPlans((current) => current.filter((plan) => plan.id !== item.id));
      setSyncStatus("error");
      const message = error instanceof Error ? error.message : "The item could not be saved.";
      setErrorMessage(message);
      throw new Error(message);
    }
  }

  async function logCompletedWork(title: string, assignedTo: string) {
    const cleanTitle = title.trim();
    if (!cleanTitle) return;
    const item: PlannerItem = {
      id: createId("log"),
      title: cleanTitle,
      day: focusedDay,
      placement: "day",
      category: "other",
      status: "done",
      timeBlock: "Anytime",
      assignedTo,
      weekStart,
      actualNotes: "",
      completedAt: new Date().toISOString(),
      actualDate: currentDateKey(),
      orderIndex: plans.length,
      syncState: "saving",
    };
    setPlans((current) => [...current, item]);
    setSyncStatus("saving");
    setErrorMessage("");
    try {
      const savedItem = await createPlannerItem(item);
      setPlans((current) => current.map((plan) => plan.id === item.id ? savedItem : plan));
      setSyncStatus(savedItem.syncState === "queued" ? "offline" : "saved");
      void trackSoftWeekEvent("quick_log_completed", { source: "today" });
    } catch (error) {
      setPlans((current) => current.filter((plan) => plan.id !== item.id));
      setSyncStatus("error");
      const message = error instanceof Error ? error.message : "That completed work could not be logged.";
      setErrorMessage(message);
      throw new Error(message);
    }
  }

  async function pastePlans(titles: string[], day: WeekDay | null, assignedTo: string) {
    let savedCount = 0;
    for (const title of titles) {
      try {
        await addPlan({ title, day, placement: day ? "day" : "week", assignedTo, timeBlock: "Anytime", category: "other", notes: "", resourceTitle: "", resourceUrl: "" });
        savedCount += 1;
      } catch {
        throw new Error(savedCount
          ? `${savedCount} ${savedCount === 1 ? "item was" : "items were"} added before the save failed. The remaining lines are still in the paste box.`
          : "The list could not be saved. Your pasted items are still in the box.");
      }
    }
  }

  async function mutate(item: PlannerItem, optimistic: Partial<PlannerItem>, operation: () => Promise<PlannerItem | null>, eventName?: Parameters<typeof trackSoftWeekEvent>[0]) {
    const before = item;
    setPlans((current) => current.map((plan) => plan.id === item.id ? { ...plan, ...optimistic, syncState: "saving" } : plan));
    setSyncStatus("saving");
    setErrorMessage("");
    try {
      const result = await operation();
      const queued = result?.syncState === "queued" || (typeof navigator !== "undefined" && !navigator.onLine);
      setPlans((current) => current.map((plan) => plan.id === item.id ? { ...plan, ...(result ?? {}), syncState: queued ? "queued" : "saved" } : plan));
      setSyncStatus(queued ? "offline" : "saved");
      if (eventName) void trackSoftWeekEvent(eventName, { source: view });
      return true;
    } catch (error) {
      setPlans((current) => current.map((plan) => plan.id === item.id ? { ...before, syncState: "error" } : plan));
      setSyncStatus("error");
      setErrorMessage(error instanceof Error ? error.message : "The change could not be saved. Your previous item was restored.");
      return false;
    }
  }

  async function persistLessonProgress(
    item: PlannerItem,
    status: "queued" | "planned" | "done" | "skipped",
    completedAt: string | null,
  ) {
    if (!item.sourceLessonStackItemId) return;
    const stack = stacks.find((candidate) => candidate.items.some((lesson) => lesson.id === item.sourceLessonStackItemId));
    if (!stack) return;
    const nextStack: LessonStack = {
      ...stack,
      updatedAt: new Date().toISOString(),
      items: stack.items.map((lesson) => lesson.id === item.sourceLessonStackItemId
        ? {
            ...lesson,
            status,
            completedAt,
            plannerItemId: status === "queued" ? null : item.id,
          }
        : lesson),
    };
    setStacks((current) => current.map((candidate) => candidate.id === stack.id ? nextStack : candidate));
    try {
      await saveLessonStack(nextStack);
    } catch (error) {
      console.error("SoftWeek course progress sync failed", error);
    }
  }

  async function complete(item: PlannerItem) {
    const completedAt = new Date().toISOString();
    const actualDate = currentDateKey();
    const saved = await mutate(item, { status: "done", completedAt, actualDate }, () => completePlannerItem(item.id, item, actualDate), "first_item_completed");
    if (saved) {
      await persistLessonProgress(item, "done", completedAt);
      if (item.sourceLessonStackItemId) void trackSoftWeekEvent("course_lesson_completed", { source: "today" });
    }
  }

  async function restore(item: PlannerItem) {
    const saved = await mutate(item, { status: "planned", completedAt: null, actualDate: null }, () => restorePlannerItem(item.id, item), "plan_status_updated");
    if (saved) await persistLessonProgress(item, "planned", null);
  }

  async function skip(item: PlannerItem) {
    const saved = await mutate(item, { status: "skipped", completedAt: null }, () => skipPlannerItem(item.id, item), "plan_status_updated");
    if (saved) await persistLessonProgress(item, "skipped", null);
  }

  function move(item: PlannerItem, day: WeekDay | null) {
    void mutate(item, { day, placement: day ? "day" : "week", status: item.status === "done" ? "done" : "moved" }, () => movePlannerItem(item.id, item, day), "item_scheduled");
  }

  function note(item: PlannerItem, value: string) {
    void mutate(item, { actualNotes: value }, () => updatePlannerItem(item.id, { actualNotes: value }, item), "plan_status_updated");
  }

  async function remove(item: PlannerItem) {
    setPlans((current) => current.filter((plan) => plan.id !== item.id));
    setSyncStatus("saving");
    try {
      await deletePlannerItem(item.id, item);
      if (item.sourceLessonStackItemId) await persistLessonProgress(item, "queued", null);
      setSyncStatus(typeof navigator !== "undefined" && !navigator.onLine ? "offline" : "saved");
      setUndo({
        label: `Deleted “${item.title}”`,
        run: async () => {
          setSyncStatus("saving");
          setErrorMessage("");
          try {
            const restoredItem = await createPlannerItem({ ...item, syncState: "saving" });
            setPlans((current) => [
              ...current.filter((plan) => plan.id !== restoredItem.id),
              restoredItem,
            ]);
            if (restoredItem.sourceLessonStackItemId) await persistLessonProgress(restoredItem, "planned", null);
            setSyncStatus(restoredItem.syncState === "queued" ? "offline" : "saved");
            setUndo(null);
          } catch (error) {
            setSyncStatus("error");
            setErrorMessage(error instanceof Error ? error.message : "The deleted item could not be restored.");
          }
        },
      });
      window.setTimeout(() => setUndo((current) => current?.label === `Deleted “${item.title}”` ? null : current), 7000);
      void trackSoftWeekEvent("plan_deleted", { source: view });
    } catch (error) {
      setPlans((current) => [...current, item]);
      setSyncStatus("error");
      setErrorMessage(error instanceof Error ? error.message : "The item could not be deleted.");
    }
  }

  function openRhythm(item?: PlannerItem) {
    setRhythmSource(item ?? null);
    setRhythmOpen(true);
  }

  async function saveRhythm(rhythm: WeeklyRhythm) {
    setSyncStatus("saving");
    setErrorMessage("");
    try {
      await saveWeeklyRhythm(rhythm);
      const nextRhythms = [rhythm, ...rhythms.filter((item) => item.id !== rhythm.id)];
      setRhythms(nextRhythms);
      setRhythmOpen(false);
      setRhythmSource(null);
      void trackSoftWeekEvent("rhythm_created", { source: "rhythm-editor", metadata: { weekdays: rhythm.weekdays.length } });

      const generated = generateRhythmItems([rhythm], weekStart, plans, createId);
      if (!generated.length) {
        setSyncStatus("saved");
        return;
      }

      const results = await Promise.allSettled(generated.map((item) => createPlannerItem(item)));
      const savedItems = results.flatMap((result) => result.status === "fulfilled" ? [result.value] : []);
      if (savedItems.length) setPlans((current) => [...current, ...savedItems]);
      const failed = generated.length - savedItems.length;
      if (failed) {
        setSyncStatus("error");
        setErrorMessage(`The rhythm was saved, but ${failed} item${failed === 1 ? "" : "s"} could not be added to this week. Reopen the week to retry.`);
      } else {
        const queued = savedItems.some((item) => item.syncState === "queued") || (typeof navigator !== "undefined" && !navigator.onLine);
        setSyncStatus(queued ? "offline" : "saved");
      }
    } catch (error) {
      setSyncStatus("error");
      setErrorMessage(error instanceof Error ? error.message : "The rhythm could not be saved.");
    }
  }

  async function toggleRhythm(rhythm: WeeklyRhythm) {
    const next = { ...rhythm, active: !rhythm.active, updatedAt: new Date().toISOString() };
    setSyncStatus("saving");
    try {
      await saveWeeklyRhythm(next);
      setRhythms((current) => current.map((item) => item.id === rhythm.id ? next : item));
      setSyncStatus("saved");
      void trackSoftWeekEvent(next.active ? "rhythm_updated" : "rhythm_paused", { source: "rhythm-editor" });
    } catch (error) {
      setSyncStatus("error");
      setErrorMessage(error instanceof Error ? error.message : "The rhythm could not be updated.");
    }
  }

  function makeCourseRhythm(stack: LessonStack, weekdays: WeekDay[], existing?: WeeklyRhythm): WeeklyRhythm {
    return {
      id: courseRhythmId(stack.id),
      name: stack.name,
      title: stack.name,
      weekdays,
      assignedTo: stack.assignedTo,
      category: stack.category,
      timeBlock: "Anytime",
      notes: existing?.notes ?? "",
      resourceTitle: existing?.resourceTitle ?? "",
      resourceUrl: existing?.resourceUrl ?? "",
      startWeek: existing?.startWeek ?? weekStart,
      endWeek: existing?.endWeek ?? null,
      active: stack.active,
      createdAt: existing?.createdAt ?? new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  async function surfaceCourseToday(stack: LessonStack, rhythm: WeeklyRhythm) {
    const generated = generateCourseLessonItems([stack], [rhythm], weekStart, plans);
    if (!generated.length) return;
    const item = generated[0];
    const savedItem = await createPlannerItem(item);
    const nextStack: LessonStack = {
      ...stack,
      updatedAt: new Date().toISOString(),
      items: stack.items.map((lesson) => lesson.id === savedItem.sourceLessonStackItemId
        ? { ...lesson, status: "planned", plannerItemId: savedItem.id, completedAt: null }
        : lesson),
    };
    await saveLessonStack(nextStack);
    setStacks((current) => current.map((candidate) => candidate.id === stack.id ? nextStack : candidate));
    setPlans((current) => current.some((plan) => plan.id === savedItem.id) ? current : [...current, savedItem]);
    void trackSoftWeekEvent("course_next_surfaced", { source: "course-rhythm" });
  }

  async function saveCourse(stack: LessonStack, weekdays: WeekDay[]) {
    setSyncStatus("saving");
    setErrorMessage("");
    const existingRhythm = rhythms.find((item) => item.id === courseRhythmId(stack.id));
    const rhythm = makeCourseRhythm(stack, weekdays, existingRhythm);
    try {
      await saveLessonStack(stack);
      await saveWeeklyRhythm(rhythm);
      setStacks((current) => [stack, ...current.filter((item) => item.id !== stack.id)]);
      setRhythms((current) => [rhythm, ...current.filter((item) => item.id !== rhythm.id)]);
      await surfaceCourseToday(stack, rhythm);
      setSyncStatus(typeof navigator !== "undefined" && !navigator.onLine ? "offline" : "saved");
      void trackSoftWeekEvent("course_created", { source: "courses", metadata: { itemCount: stack.items.length, weekdays: weekdays.length } });
      void trackSoftWeekEvent("onboarding_completed", { source: "course-created", metadata: { itemCount: stack.items.length } });
    } catch (error) {
      setSyncStatus("error");
      const message = error instanceof Error ? error.message : "The course could not be saved.";
      setErrorMessage(message);
      throw new Error(message);
    }
  }

  async function updateCourseDays(stack: LessonStack, weekdays: WeekDay[]) {
    if (!weekdays.length) return;
    const existing = rhythms.find((item) => item.id === courseRhythmId(stack.id));
    const rhythm = makeCourseRhythm(stack, weekdays, existing);
    setRhythms((current) => [rhythm, ...current.filter((item) => item.id !== rhythm.id)]);
    setSyncStatus("saving");
    try {
      await saveWeeklyRhythm(rhythm);
      await surfaceCourseToday(stack, rhythm);
      setSyncStatus(typeof navigator !== "undefined" && !navigator.onLine ? "offline" : "saved");
      void trackSoftWeekEvent("course_rhythm_updated", { source: "courses", metadata: { weekdays: weekdays.length } });
    } catch (error) {
      setSyncStatus("error");
      setErrorMessage(error instanceof Error ? error.message : "Those course days could not be saved.");
    }
  }

  async function toggleCourse(stack: LessonStack) {
    const nextStack = { ...stack, active: !stack.active, updatedAt: new Date().toISOString() };
    const existing = rhythms.find((item) => item.id === courseRhythmId(stack.id));
    const rhythm = makeCourseRhythm(nextStack, existing?.weekdays?.length ? existing.weekdays : ["Monday", "Tuesday", "Wednesday", "Thursday"], existing);
    setSyncStatus("saving");
    try {
      await saveLessonStack(nextStack);
      await saveWeeklyRhythm(rhythm);
      setStacks((current) => current.map((item) => item.id === stack.id ? nextStack : item));
      setRhythms((current) => [rhythm, ...current.filter((item) => item.id !== rhythm.id)]);
      if (nextStack.active) await surfaceCourseToday(nextStack, rhythm);
      setSyncStatus(typeof navigator !== "undefined" && !navigator.onLine ? "offline" : "saved");
      void trackSoftWeekEvent(nextStack.active ? "course_resumed" : "course_paused", { source: "courses" });
    } catch (error) {
      setSyncStatus("error");
      setErrorMessage(error instanceof Error ? error.message : "The course could not be updated.");
    }
  }

  async function addLessons(stack: LessonStack, count: number, targetDay: WeekDay = focusedDay) {
    const visiblePlanIds = new Set(plans.map((item) => item.id));
    const lessons = [...stack.items]
      .sort((a, b) => a.position - b.position)
      .filter((lesson) => lesson.status === "queued" || (lesson.status === "planned" && (!lesson.plannerItemId || !visiblePlanIds.has(lesson.plannerItemId))))
      .slice(0, count);
    if (!lessons.length) return;
    const created = lessons.map((lesson, index): PlannerItem => ({
      id: `lesson-plan:${lesson.id}:${weekStart}:${targetDay}`,
      title: lesson.title,
      day: targetDay,
      placement: "day",
      category: stack.category,
      status: "planned",
      timeBlock: "Anytime",
      assignedTo: stack.assignedTo,
      weekStart,
      orderIndex: plans.length + index,
      sourceLessonStackItemId: lesson.id,
      syncState: "saving",
    }));
    setPlans((current) => [...current, ...created]);
    setSyncStatus("saving");
    setErrorMessage("");
    try {
      const results = await Promise.allSettled(created.map((item) => createPlannerItem(item)));
      const savedItems = results.flatMap((result) => result.status === "fulfilled" ? [result.value] : []);
      const savedIds = new Set(savedItems.map((item) => item.id));
      const nextStack: LessonStack = {
        ...stack,
        updatedAt: new Date().toISOString(),
        items: stack.items.map((item) => {
          const generated = created.find((plan) => plan.sourceLessonStackItemId === item.id);
          return generated && savedIds.has(generated.id)
            ? { ...item, status: "planned" as const, plannerItemId: generated.id, completedAt: null }
            : item;
        }),
      };
      if (savedItems.length) await saveLessonStack(nextStack);
      setStacks((current) => current.map((item) => item.id === stack.id ? nextStack : item));
      setPlans((current) => [
        ...current.filter((item) => !created.some((createdItem) => createdItem.id === item.id)),
        ...savedItems,
      ]);
      const failed = created.length - savedItems.length;
      const queued = savedItems.some((item) => item.syncState === "queued") || (typeof navigator !== "undefined" && !navigator.onLine);
      if (failed) {
        setSyncStatus("error");
        setErrorMessage(`${savedItems.length} lesson${savedItems.length === 1 ? " was" : "s were"} added. ${failed} could not be saved and can be retried.`);
      } else {
        setSyncStatus(queued ? "offline" : "saved");
        void trackSoftWeekEvent("course_next_added", { source: "courses", metadata: { count: savedItems.length } });
      }
    } catch (error) {
      await Promise.allSettled(created.map((item) => deletePlannerItem(item.id, item)));
      setPlans((current) => current.filter((item) => !created.some((createdItem) => createdItem.id === item.id)));
      setSyncStatus("error");
      setErrorMessage(error instanceof Error ? error.message : "The next lesson could not be added.");
    }
  }

  async function applyLifeHappened(mode: RecoveryMode, changes: RecoveryChange[], dayKind?: string) {
    const before = plans;
    const nextAll = applyRecoveryChanges(plans, changes);
    const nextVisible = nextAll.filter((item) => item.weekStart === weekStart);
    setPlans(nextVisible);
    setLifeOpen(false);
    setSyncStatus("saving");
    try {
      await bulkMovePlannerItems(changes.map((change) => {
        const plan = before.find((item) => item.id === change.id)!;
        return { id: change.id, plan, patch: { day: change.toDay, placement: change.placement, weekStart: change.toWeekStart, status: "moved" } };
      }));
      setSyncStatus(typeof navigator !== "undefined" && !navigator.onLine ? "offline" : "saved");
      setUndo({
        label: `Moved ${changes.length} ${changes.length === 1 ? "item" : "items"}`,
        run: async () => {
          setSyncStatus("saving");
          setErrorMessage("");
          try {
            await bulkMovePlannerItems(changes.map((change) => {
              const current = nextAll.find((item) => item.id === change.id)!;
              const original = before.find((item) => item.id === change.id)!;
              return {
                id: change.id,
                plan: current,
                patch: {
                  day: change.fromDay,
                  placement: change.fromDay ? "day" : "week",
                  weekStart: change.fromWeekStart,
                  status: original.status,
                },
              };
            }));
            setPlans(before);
            setSyncStatus(typeof navigator !== "undefined" && !navigator.onLine ? "offline" : "saved");
            setUndo(null);
            void trackSoftWeekEvent("life_happened_undone", { source: "recovery" });
          } catch (error) {
            setSyncStatus("error");
            setErrorMessage(error instanceof Error ? error.message : "The recovery changes could not be undone.");
          }
        },
      });
      void trackSoftWeekEvent("life_happened_applied", { source: "recovery", metadata: { mode, affected: changes.length, dayKind: dayKind || null } });
    } catch (error) {
      setPlans(before);
      setSyncStatus("error");
      setErrorMessage(error instanceof Error ? error.message : "The recovery changes could not be saved.");
    }
  }

  async function copyLastWeek() {
    const previousStart = shiftWeekStart(weekStart, -1);
    const before = plans;
    setSyncStatus("saving");
    setErrorMessage("");
    try {
      const previous = await readPlannerWeek(previousStart);
      const existingKeys = new Set(plans.map((item) => `${item.title}|${item.day}|${item.assignedTo}`));
      const copies = previous
        .filter((item) => !existingKeys.has(`${item.title}|${item.day}|${item.assignedTo}`))
        .map((item, index): PlannerItem => ({
          ...item,
          id: `copy:${item.id}:${weekStart}`,
          weekStart,
          status: "planned",
          completedAt: null,
          actualDate: null,
          actualNotes: "",
          sourceRhythmId: null,
          orderIndex: plans.length + index,
          syncState: "saving",
        }));
      if (!copies.length) {
        setSyncStatus("saved");
        setErrorMessage("There was nothing new to copy from last week.");
        return;
      }
      setPlans([...before, ...copies]);
      const results = await Promise.allSettled(copies.map((item) => createPlannerItem(item)));
      const savedCopies = results.flatMap((result) => result.status === "fulfilled" ? [result.value] : []);
      const failedCopies = results.filter((result) => result.status === "rejected");
      setPlans([...before, ...savedCopies]);
      if (failedCopies.length) {
        setSyncStatus("error");
        setErrorMessage(`${savedCopies.length} item${savedCopies.length === 1 ? " was" : "s were"} copied. ${failedCopies.length} could not be saved.`);
      } else {
        const queued = savedCopies.some((item) => item.syncState === "queued") || (typeof navigator !== "undefined" && !navigator.onLine);
        setSyncStatus(queued ? "offline" : "saved");
      }
      if (savedCopies.length) void trackSoftWeekEvent("last_week_copied", { source: "week-tools", metadata: { count: savedCopies.length } });
    } catch (error) {
      setPlans(before);
      setSyncStatus("error");
      setErrorMessage(error instanceof Error ? error.message : "Last week could not be copied.");
    }
  }

  async function closeWeek(unfinishedIds: string[], familyNote: string) {
    const targetWeek = shiftWeekStart(weekStart, 1);
    const selected = plans.filter((item) => unfinishedIds.includes(item.id));
    const carried = selected.map((item, index): PlannerItem => ({
      ...item,
      id: `carry:${item.id}:${targetWeek}`,
      weekStart: targetWeek,
      day: null,
      placement: "week",
      status: "planned",
      completedAt: null,
      actualDate: null,
      actualNotes: "",
      orderIndex: index,
      syncState: "saving",
    }));
    const record: SavedWeekLog = {
      id: stableWeekRecordId(weekStart),
      weekLabel: weekRange.weekLabel,
      weekStart,
      weekEnd: weekRange.weekEnd,
      savedAt: new Date().toISOString(),
      closedAt: new Date().toISOString(),
      familyNote: familyNote.trim(),
      children,
      plans: plans.map(withoutSyncState),
      childSummaries: generateChildWeeklySummaries(children, plans),
    };
    setSyncStatus("saving");
    try {
      await saveWeekLog(record);
      const carryResults = await Promise.allSettled(carried.map((item) => createPlannerItem(item)));
      const carryFailures = carryResults.filter((result) => result.status === "rejected");
      if (carryFailures.length) {
        throw new Error(`${carried.length - carryFailures.length} item${carried.length - carryFailures.length === 1 ? " was" : "s were"} carried forward, but ${carryFailures.length} could not be saved. Reopen closeout to retry; successful items will not duplicate.`);
      }
      setCloseoutOpen(false);
      void trackSoftWeekEvent("week_closeout_completed", { source: "closeout", metadata: { carried: carried.length } });
      void trackSoftWeekEvent("next_week_created", { source: "closeout" });
      setView("week");
      await loadWeek(targetWeek, rhythms, stacks);
    } catch (error) {
      setSyncStatus("error");
      setErrorMessage(error instanceof Error ? error.message : "The week could not be closed.");
    }
  }

  if (loading) {
    return <section className="sw-planner-loading"><div className="sw-loading-line" /><div className="sw-loading-line is-short" /><div className="sw-loading-block" /></section>;
  }

  const syncLabel = syncStatus === "saving" ? "Saving…" : syncStatus === "offline" ? "Offline" : syncStatus === "error" ? "Could not save" : "Saved";

  return (
    <div className="sw-planner-app">
      <div className="sw-planner-status-bar">
        <span className={`sw-sync-state is-${syncStatus}`} role="status" aria-live="polite">{syncLabel}</span>
      </div>

      {errorMessage ? <div className="sw-error-banner" role="alert"><span>{errorMessage}</span><button type="button" onClick={() => setErrorMessage("")}>Dismiss</button></div> : null}
      {recordWarning ? <div className="sw-warning-banner" role="status"><span>{recordWarning}</span><button type="button" onClick={() => setRecordWarning("")}>Dismiss</button></div> : null}

      {view === "today" ? (
        <TodayScreen
          plans={plans}
          children={children}
          stacks={stacks}
          weekStart={weekStart}
          day={focusedDay}
          activeChildId={activeChildId}
          canEdit={canEdit}
          canMove={canMove}
          isGuest={account?.isGuest ?? false}
          focusToken={focusToken}
          onChildChange={setActiveChildId}
          onAdd={addPlan}
          onComplete={complete}
          onRestore={restore}
          onMove={move}
          onSkip={skip}
          onDelete={(item) => void remove(item)}
          onNote={note}
          onMakeRhythm={openRhythm}
          onOpenCourses={() => { setView("courses"); void trackSoftWeekEvent("course_opened", { source: "today" }); }}
          onLogDone={logCompletedWork}
        />
      ) : view === "courses" ? (
        <CourseScreen
          stacks={stacks}
          children={children}
          rhythms={rhythms}
          canEdit={canEdit}
          onSaveCourse={saveCourse}
          onUpdateDays={updateCourseDays}
          onToggleCourse={toggleCourse}
          onAddNext={(stack) => addLessons(stack, 1, focusedDay)}
        />
      ) : (
        <WeekScreen
          plans={plans}
          children={children}
          weekStart={weekStart}
          weekLabel={weekRange.weekLabel}
          activeChildId={activeChildId}
          canEdit={canEdit}
          canMove={canMove}
          focusToken={focusToken}
          onChildChange={setActiveChildId}
          onSwitchWeek={(direction) => void loadWeek(shiftWeekStart(weekStart, direction), rhythms, stacks)}
          onThisWeek={() => void loadWeek(getCurrentWeekRange().weekStart, rhythms, stacks)}
          onAdd={addPlan}
          onPaste={pastePlans}
          onComplete={complete}
          onRestore={restore}
          onMove={move}
          onSkip={skip}
          onDelete={(item) => void remove(item)}
          onNote={note}
          onMakeRhythm={openRhythm}
          onLifeHappened={(day) => { setLifeDay(day); setLifeOpen(true); void trackSoftWeekEvent("life_happened_opened", { source: day ? "day" : "week" }); }}
          onOpenRhythms={() => openRhythm()}
          onCopyLastWeek={() => void copyLastWeek()}
          onCloseout={() => { setCloseoutOpen(true); void trackSoftWeekEvent("week_closeout_started", { source: "week-tools" }); }}
        />
      )}

      {canEdit && !account?.isGuest && (stacks.length > 0 || plans.length >= 3) ? <PwaInstallPrompt compact className="sw-retention-install" /> : null}

      {undo ? <div className="sw-undo-toast" role="status"><span>{undo.label}</span><button type="button" onClick={() => void undo.run()}>Undo</button></div> : null}
      {lifeOpen ? <LifeHappenedDialog plans={plans} weekStart={weekStart} selectedDay={lifeDay} onClose={() => setLifeOpen(false)} onApply={(mode, changes, dayKind) => void applyLifeHappened(mode, changes, dayKind)} /> : null}
      {rhythmOpen ? <WeeklyRhythmEditor weekStart={weekStart} children={children} rhythms={rhythms.filter((rhythm) => !isCourseRhythm(rhythm))} sourceItem={rhythmSource} onSave={(rhythm) => void saveRhythm(rhythm)} onToggle={(rhythm) => void toggleRhythm(rhythm)} onClose={() => { setRhythmOpen(false); setRhythmSource(null); }} /> : null}
      {closeoutOpen ? <WeekCloseout plans={plans} onClose={() => setCloseoutOpen(false)} onComplete={(ids, noteValue) => void closeWeek(ids, noteValue)} /> : null}
    </div>
  );
}
