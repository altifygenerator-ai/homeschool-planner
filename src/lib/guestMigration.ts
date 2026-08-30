import { createPlannerItem, saveLessonStack, saveWeeklyRhythm } from "@/lib/plannerRepository";
import { saveCategoryDefinitions, saveChildren, saveWeekLog } from "@/lib/plannerStorage";
import { generateChildWeeklySummaries } from "@/lib/weeklySummary";
import type { CategoryDefinition, ChildProfile, LessonStack, PlannerItem, SavedWeekLog, WeeklyRhythm } from "@/types/planner";

const CHILDREN_KEY = "softweek_children";
const CATEGORIES_KEY = "softweek_categories";
const RHYTHMS_KEY = "softweek_weekly_rhythms";
const STACKS_KEY = "softweek_lesson_stacks";
const SAVED_WEEKS_KEY = "softweek_saved_weeks";
const CURRENT_PLANS_KEY = "softweek_current_plans";
const WEEK_PLANS_PREFIX = "softweek_week_plans:";

function parse<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  try { return JSON.parse(value) as T; } catch { return fallback; }
}

function isSamplePlan(plan: PlannerItem) {
  return plan.id.startsWith("guest-demo-");
}

export function hasGuestPlannerData() {
  if (typeof window === "undefined") return false;
  const children = parse<ChildProfile[]>(window.localStorage.getItem(CHILDREN_KEY), []);
  const stacks = parse<LessonStack[]>(window.localStorage.getItem(STACKS_KEY), []);
  const rhythms = parse<WeeklyRhythm[]>(window.localStorage.getItem(RHYTHMS_KEY), []);
  if (children.length || stacks.length || rhythms.length) return true;

  for (let index = 0; index < window.localStorage.length; index += 1) {
    const key = window.localStorage.key(index);
    if (!key?.startsWith(WEEK_PLANS_PREFIX)) continue;
    const plans = parse<PlannerItem[]>(window.localStorage.getItem(key), []);
    if (plans.some((plan) => !isSamplePlan(plan))) return true;
  }
  return false;
}

export async function migrateGuestPlannerToActiveAccount() {
  if (typeof window === "undefined") return { migrated: 0 };

  const children = parse<ChildProfile[]>(window.localStorage.getItem(CHILDREN_KEY), []);
  const categories = parse<CategoryDefinition[]>(window.localStorage.getItem(CATEGORIES_KEY), []);
  const rhythms = parse<WeeklyRhythm[]>(window.localStorage.getItem(RHYTHMS_KEY), []);
  const stacks = parse<LessonStack[]>(window.localStorage.getItem(STACKS_KEY), []);
  const savedWeeks = parse<SavedWeekLog[]>(window.localStorage.getItem(SAVED_WEEKS_KEY), []);
  const cleanedSavedWeeks = savedWeeks.flatMap((record) => {
    const realPlans = record.plans.filter((plan) => !isSamplePlan(plan));
    if (!realPlans.length && !record.familyNote?.trim()) return [];
    return [{
      ...record,
      plans: realPlans,
      childSummaries: generateChildWeeklySummaries(record.children, realPlans),
    }];
  });
  const plans: PlannerItem[] = [];
  const seenPlanIds = new Set<string>();

  for (let index = 0; index < window.localStorage.length; index += 1) {
    const key = window.localStorage.key(index);
    if (!key?.startsWith(WEEK_PLANS_PREFIX)) continue;
    const weekPlans = parse<PlannerItem[]>(window.localStorage.getItem(key), []);
    for (const plan of weekPlans) {
      if (isSamplePlan(plan) || seenPlanIds.has(plan.id)) continue;
      seenPlanIds.add(plan.id);
      plans.push(plan);
    }
  }

  if (children.length) await saveChildren(children);
  if (categories.length) await saveCategoryDefinitions(categories);
  for (const rhythm of rhythms) await saveWeeklyRhythm(rhythm);
  for (const stack of stacks) await saveLessonStack(stack);
  for (const plan of plans) await createPlannerItem(plan);
  for (const record of cleanedSavedWeeks) await saveWeekLog(record);

  const keysToRemove = [CHILDREN_KEY, CATEGORIES_KEY, RHYTHMS_KEY, STACKS_KEY, SAVED_WEEKS_KEY, CURRENT_PLANS_KEY];
  for (const key of keysToRemove) window.localStorage.removeItem(key);
  const weekKeys: string[] = [];
  for (let index = 0; index < window.localStorage.length; index += 1) {
    const key = window.localStorage.key(index);
    if (key?.startsWith(WEEK_PLANS_PREFIX)) weekKeys.push(key);
  }
  for (const key of weekKeys) window.localStorage.removeItem(key);

  return {
    migrated: children.length + rhythms.length + stacks.length + plans.length + cleanedSavedWeeks.length,
  };
}
