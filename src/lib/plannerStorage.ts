import { defaultCategoryDefinitions } from "@/data/demoPlans";
import { getActiveFamilyId } from "@/lib/localAuth";
import { getCurrentWeekRange } from "@/lib/week";
import type {
  CategoryDefinition,
  ChildProfile,
  PlannerItem,
  SavedWeekLog,
} from "@/types/planner";

const SAVED_WEEKS_KEY = "softweek_saved_weeks";
const CURRENT_PLANS_KEY = "softweek_current_plans";
const CHILDREN_KEY = "softweek_children";
const ACTIVE_WEEK_START_KEY = "softweek_active_week_start";
const WEEK_PLANS_PREFIX = "softweek_week_plans";
const CATEGORIES_KEY = "softweek_categories";

export const EVERYONE_CHILD: ChildProfile = {
  id: "everyone",
  name: "Everyone",
  colorLabel: "sage",
};

function safeParse<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;

  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function scopedKey(key: string) {
  return `${key}:${getActiveFamilyId()}`;
}

function readScopedValue(key: string) {
  if (typeof window === "undefined") return null;

  const scoped = window.localStorage.getItem(scopedKey(key));
  if (scoped !== null) return scoped;

  // Let the guest/local beta keep seeing early tester data saved before accounts existed.
  if (getActiveFamilyId() === "guest-family") {
    return window.localStorage.getItem(key);
  }

  return null;
}

function writeScopedValue(key: string, value: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(scopedKey(key), value);
}

function removeScopedValue(key: string) {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(scopedKey(key));

  if (getActiveFamilyId() === "guest-family") {
    window.localStorage.removeItem(key);
  }
}

function cleanChildren(children: ChildProfile[]) {
  const seen = new Set<string>();

  return children
    .filter((child) => child.id !== EVERYONE_CHILD.id)
    .map((child) => ({
      ...child,
      name: child.name.trim(),
    }))
    .filter((child) => child.name.length > 0 && child.id.length > 0)
    .filter((child) => {
      if (seen.has(child.id)) return false;
      seen.add(child.id);
      return true;
    });
}

function normalizeWeekStart(weekStart: string) {
  return weekStart.slice(0, 10);
}

function weekPlansKey(weekStart: string) {
  return `${WEEK_PLANS_PREFIX}:${normalizeWeekStart(weekStart)}`;
}

function makeCategoryId(name: string) {
  return name
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 48);
}

function cleanCategories(categories: CategoryDefinition[]) {
  const seen = new Set<string>();

  return categories
    .map((category) => ({
      ...category,
      id: makeCategoryId(category.id || category.label),
      label: category.label.trim(),
      isCustom: Boolean(category.isCustom),
    }))
    .filter((category) => category.id.length > 0 && category.label.length > 0)
    .filter((category) => {
      if (seen.has(category.id)) return false;
      seen.add(category.id);
      return true;
    });
}

export function getActiveWeekStart() {
  if (typeof window === "undefined") return getCurrentWeekRange().weekStart;

  const saved = readScopedValue(ACTIVE_WEEK_START_KEY);
  return saved || getCurrentWeekRange().weekStart;
}

export function saveActiveWeekStart(weekStart: string) {
  writeScopedValue(ACTIVE_WEEK_START_KEY, weekStart);
}

export function getPlansForWeek(weekStart: string): PlannerItem[] {
  if (typeof window === "undefined") return [];

  const nextPlans = safeParse<PlannerItem[]>(
    readScopedValue(weekPlansKey(weekStart)),
    []
  );

  if (nextPlans.length) return nextPlans;

  const legacyPlans = safeParse<PlannerItem[]>(
    readScopedValue(CURRENT_PLANS_KEY),
    []
  );

  if (
    legacyPlans.length &&
    normalizeWeekStart(weekStart) === normalizeWeekStart(getCurrentWeekRange().weekStart)
  ) {
    return legacyPlans.map((plan) => ({ ...plan, weekStart }));
  }

  return [];
}

export function savePlansForWeek(weekStart: string, plans: PlannerItem[]) {
  if (typeof window === "undefined") return;

  const stampedPlans = plans.map((plan) => ({
    ...plan,
    weekStart,
  }));

  writeScopedValue(weekPlansKey(weekStart), JSON.stringify(stampedPlans));

  if (normalizeWeekStart(weekStart) === normalizeWeekStart(getCurrentWeekRange().weekStart)) {
    writeScopedValue(CURRENT_PLANS_KEY, JSON.stringify(stampedPlans));
  }
}

export function clearPlansForWeek(weekStart: string) {
  removeScopedValue(weekPlansKey(weekStart));

  if (normalizeWeekStart(weekStart) === normalizeWeekStart(getCurrentWeekRange().weekStart)) {
    removeScopedValue(CURRENT_PLANS_KEY);
  }
}

export function getCurrentPlans(): PlannerItem[] {
  return getPlansForWeek(getActiveWeekStart());
}

export function saveCurrentPlans(plans: PlannerItem[]) {
  savePlansForWeek(getActiveWeekStart(), plans);
}

export function clearCurrentPlans() {
  clearPlansForWeek(getActiveWeekStart());
}

export function getChildren(): ChildProfile[] {
  if (typeof window === "undefined") return [EVERYONE_CHILD];

  const saved = safeParse<ChildProfile[]>(readScopedValue(CHILDREN_KEY), []);
  return [EVERYONE_CHILD, ...cleanChildren(saved)];
}

export function saveChildren(children: ChildProfile[]) {
  writeScopedValue(CHILDREN_KEY, JSON.stringify(cleanChildren(children)));
}

export function renameChildProfile(childId: string, name: string) {
  if (typeof window === "undefined") return getChildren();

  const next = getChildren().map((child) =>
    child.id === childId ? { ...child, name: name.trim() || child.name } : child
  );

  saveChildren(next);
  return getChildren();
}

export function deleteChildProfile(childId: string) {
  if (typeof window === "undefined" || childId === EVERYONE_CHILD.id) {
    return getChildren();
  }

  const nextChildren = getChildren().filter((child) => child.id !== childId);
  saveChildren(nextChildren);

  const activeWeekStart = getActiveWeekStart();
  const nextPlans = getPlansForWeek(activeWeekStart).map((plan) =>
    plan.assignedTo === childId ? { ...plan, assignedTo: EVERYONE_CHILD.id } : plan
  );
  savePlansForWeek(activeWeekStart, nextPlans);

  return getChildren();
}

export function getCategoryDefinitions(): CategoryDefinition[] {
  if (typeof window === "undefined") return defaultCategoryDefinitions;

  const saved = safeParse<CategoryDefinition[]>(
    readScopedValue(CATEGORIES_KEY),
    []
  );

  const customOnly = cleanCategories(saved).filter(
    (savedCategory) =>
      !defaultCategoryDefinitions.some(
        (defaultCategory) => defaultCategory.id === savedCategory.id
      )
  );

  return [...defaultCategoryDefinitions, ...customOnly];
}

export function saveCategoryDefinitions(categories: CategoryDefinition[]) {
  if (typeof window === "undefined") return;

  const customOnly = cleanCategories(categories).filter(
    (category) =>
      category.isCustom &&
      !defaultCategoryDefinitions.some(
        (defaultCategory) => defaultCategory.id === category.id
      )
  );

  writeScopedValue(CATEGORIES_KEY, JSON.stringify(customOnly));
}

export function addCategoryDefinition(name: string) {
  const label = name.trim();
  if (!label) return getCategoryDefinitions()[0];

  const current = getCategoryDefinitions();
  const baseId = makeCategoryId(label);
  let id = baseId || "custom";
  let count = 2;

  while (current.some((category) => category.id === id)) {
    id = `${baseId}-${count}`;
    count += 1;
  }

  const nextCategory: CategoryDefinition = {
    id,
    label,
    isCustom: true,
  };

  saveCategoryDefinitions([...current, nextCategory]);
  return nextCategory;
}

export function deleteCategoryDefinition(categoryId: string) {
  if (typeof window === "undefined") return getCategoryDefinitions();

  const next = getCategoryDefinitions().filter(
    (category) => category.id !== categoryId || !category.isCustom
  );

  saveCategoryDefinitions(next);
  return getCategoryDefinitions();
}

export function getSavedWeeks(): SavedWeekLog[] {
  if (typeof window === "undefined") return [];
  return safeParse<SavedWeekLog[]>(readScopedValue(SAVED_WEEKS_KEY), []);
}

export function saveWeekLog(log: SavedWeekLog) {
  if (typeof window === "undefined") return;

  const current = getSavedWeeks();
  const withoutDuplicate = current.filter((item) => item.id !== log.id);
  const next = [log, ...withoutDuplicate];

  writeScopedValue(SAVED_WEEKS_KEY, JSON.stringify(next));
}

export function deleteSavedWeek(weekId: string) {
  if (typeof window === "undefined") return;

  const current = getSavedWeeks();
  const next = current.filter((week) => week.id !== weekId);

  writeScopedValue(SAVED_WEEKS_KEY, JSON.stringify(next));
}

export function clearSavedWeeks() {
  removeScopedValue(SAVED_WEEKS_KEY);
}
