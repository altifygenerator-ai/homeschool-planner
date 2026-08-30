import type { LessonStack, PlannerItem, WeekDay, WeeklyRhythm } from "@/types/planner";

const weekDays: WeekDay[] = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export const COURSE_RHYTHM_PREFIX = "course-rhythm:";

function shiftWeekStart(weekStart: string, weeks: number) {
  const [year, month, day] = weekStart.slice(0, 10).split("-").map(Number);
  const value = new Date(year, month - 1, day, 12, 0, 0, 0);
  value.setDate(value.getDate() + weeks * 7);
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;
}

export type RecoveryMode =
  | "tomorrow"
  | "spread"
  | "this-week"
  | "next-week";

export type RecoveryChange = {
  id: string;
  fromDay: WeekDay | null;
  toDay: WeekDay | null;
  fromWeekStart: string;
  toWeekStart: string;
  placement: "week" | "day";
};

export function dateKeyForDay(weekStart: string, day: WeekDay) {
  const [year, month, date] = weekStart.slice(0, 10).split("-").map(Number);
  const value = new Date(year, month - 1, date, 12, 0, 0, 0);
  value.setDate(value.getDate() + weekDays.indexOf(day));
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;
}

export function dayForDate(weekStart: string, date = new Date()): WeekDay | null {
  const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  return weekDays.find((day) => dateKeyForDay(weekStart, day) === key) ?? null;
}

export function unfinishedBeforeDay(plans: PlannerItem[], weekStart: string, day: WeekDay) {
  const target = weekDays.indexOf(day);
  return plans.filter(
    (plan) =>
      plan.weekStart === weekStart &&
      plan.placement === "day" &&
      plan.day !== null &&
      weekDays.indexOf(plan.day) < target &&
      !["done", "skipped"].includes(plan.status),
  );
}

export function buildRecoveryChanges({
  plans,
  weekStart,
  selectedDay,
  mode,
}: {
  plans: PlannerItem[];
  weekStart: string;
  selectedDay?: WeekDay;
  mode: RecoveryMode;
}): RecoveryChange[] {
  const candidates = plans.filter((plan) => {
    if (plan.weekStart !== weekStart || ["done", "skipped"].includes(plan.status)) return false;
    return selectedDay ? plan.day === selectedDay : true;
  });

  const selectedIndex = selectedDay ? weekDays.indexOf(selectedDay) : -1;
  const remainingDays = weekDays.slice(Math.max(selectedIndex + 1, 0));

  return candidates.map((plan, index) => {
    if (mode === "this-week") {
      return {
        id: plan.id,
        fromDay: plan.day,
        toDay: null,
        fromWeekStart: weekStart,
        toWeekStart: weekStart,
        placement: "week" as const,
      };
    }

    if (mode === "next-week") {
      return {
        id: plan.id,
        fromDay: plan.day,
        toDay: null,
        fromWeekStart: weekStart,
        toWeekStart: shiftWeekStart(weekStart, 1),
        placement: "week" as const,
      };
    }

    const fallbackDay = selectedDay
      ? weekDays[Math.min(selectedIndex + 1, weekDays.length - 1)]
      : plan.day ?? "Monday";
    const toDay = mode === "spread" && remainingDays.length
      ? remainingDays[index % remainingDays.length]
      : fallbackDay;

    return {
      id: plan.id,
      fromDay: plan.day,
      toDay,
      fromWeekStart: weekStart,
      toWeekStart: weekStart,
      placement: "day" as const,
    };
  });
}

export function applyRecoveryChanges(plans: PlannerItem[], changes: RecoveryChange[]) {
  const byId = new Map(changes.map((change) => [change.id, change]));
  return plans.map((plan) => {
    const change = byId.get(plan.id);
    if (!change) return plan;
    return {
      ...plan,
      day: change.toDay,
      placement: change.placement,
      weekStart: change.toWeekStart,
      status: "moved" as const,
    };
  });
}

export function rhythmAppliesToWeek(rhythm: WeeklyRhythm, weekStart: string) {
  return rhythm.active && rhythm.startWeek <= weekStart && (!rhythm.endWeek || rhythm.endWeek >= weekStart);
}

export function courseRhythmId(stackId: string) {
  return `${COURSE_RHYTHM_PREFIX}${stackId}`;
}

export function isCourseRhythm(rhythm: WeeklyRhythm | { id: string }) {
  return rhythm.id.startsWith(COURSE_RHYTHM_PREFIX);
}

export function courseIdFromRhythm(rhythm: WeeklyRhythm | { id: string }) {
  return isCourseRhythm(rhythm) ? rhythm.id.slice(COURSE_RHYTHM_PREFIX.length) : null;
}

export function generateRhythmItems(
  rhythms: WeeklyRhythm[],
  weekStart: string,
  existing: PlannerItem[],
  _createId: (prefix: string) => string,
) {
  const keys = new Set(
    existing
      .filter((item) => item.sourceRhythmId)
      .map((item) => `${item.sourceRhythmId}:${item.weekStart}:${item.day}`),
  );

  const generated: PlannerItem[] = [];
  for (const rhythm of rhythms.filter((item) => !isCourseRhythm(item) && rhythmAppliesToWeek(item, weekStart))) {
    for (const day of rhythm.weekdays) {
      const key = `${rhythm.id}:${weekStart}:${day}`;
      if (keys.has(key)) continue;
      keys.add(key);
      generated.push({
        id: `rhythm:${rhythm.id}:${weekStart}:${day}`,
        title: rhythm.title,
        day,
        placement: "day",
        category: rhythm.category,
        status: "planned",
        timeBlock: rhythm.timeBlock,
        assignedTo: rhythm.assignedTo,
        weekStart,
        notes: rhythm.notes ?? "",
        resourceTitle: rhythm.resourceTitle ?? "",
        resourceUrl: rhythm.resourceUrl ?? "",
        sourceRhythmId: rhythm.id,
        orderIndex: 0,
      });
    }
  }
  return generated;
}

/**
 * Feed at most one open lesson per course into the real current day.
 * This is intentionally not a month-ahead scheduler: if today's lesson is not
 * finished, the course remains on that lesson instead of creating tomorrow's.
 */
export function generateCourseLessonItems(
  stacks: LessonStack[],
  rhythms: WeeklyRhythm[],
  weekStart: string,
  existing: PlannerItem[],
) {
  const today = dayForDate(weekStart);
  if (!today) return [];

  const existingPlanIds = new Set(existing.map((item) => item.id));
  const existingLessonIds = new Set(existing.map((item) => item.sourceLessonStackItemId).filter(Boolean));
  const generated: PlannerItem[] = [];

  for (const stack of stacks.filter((item) => item.active)) {
    const rhythm = rhythms.find((item) => item.id === courseRhythmId(stack.id));
    if (!rhythm || !rhythmAppliesToWeek(rhythm, weekStart) || !rhythm.weekdays.includes(today)) continue;

    const stackLessonIds = new Set(stack.items.map((item) => item.id));
    const alreadyOpen = existing.some(
      (item) => stackLessonIds.has(item.sourceLessonStackItemId ?? "") && !["done", "skipped"].includes(item.status),
    );
    if (alreadyOpen) continue;

    const next = [...stack.items]
      .sort((a, b) => a.position - b.position)
      .find((item) => {
        if (item.status === "queued") return true;
        if (item.status !== "planned") return false;
        // A planned lesson from an older week should become visible again in
        // the current day rather than leaving the course silently stuck.
        return !item.plannerItemId || !existingPlanIds.has(item.plannerItemId);
      });

    if (!next || existingLessonIds.has(next.id)) continue;

    generated.push({
      id: `course-plan:${stack.id}:${next.id}:${dateKeyForDay(weekStart, today)}`,
      title: next.title,
      day: today,
      placement: "day",
      category: stack.category,
      status: "planned",
      timeBlock: "Anytime",
      assignedTo: stack.assignedTo,
      weekStart,
      notes: "",
      resourceTitle: "",
      resourceUrl: "",
      sourceRhythmId: rhythm.id,
      sourceLessonStackItemId: next.id,
      orderIndex: existing.length + generated.length,
    });
    existingLessonIds.add(next.id);
  }

  return generated;
}

export function nextLessonItems<T extends { status: string; position: number }>(items: T[], count = 1) {
  return items
    .filter((item) => item.status === "queued")
    .sort((a, b) => a.position - b.position)
    .slice(0, count);
}
