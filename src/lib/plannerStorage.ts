import type { ChildProfile, PlannerItem, SavedWeekLog } from "@/types/planner";

const SAVED_WEEKS_KEY = "softweek_saved_weeks";
const CURRENT_PLANS_KEY = "softweek_current_plans";
const CHILDREN_KEY = "softweek_children";

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

export function getCurrentPlans(): PlannerItem[] {
  if (typeof window === "undefined") return [];
  return safeParse<PlannerItem[]>(window.localStorage.getItem(CURRENT_PLANS_KEY), []);
}

export function saveCurrentPlans(plans: PlannerItem[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CURRENT_PLANS_KEY, JSON.stringify(plans));
}

export function clearCurrentPlans() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(CURRENT_PLANS_KEY);
}

export function getChildren(): ChildProfile[] {
  if (typeof window === "undefined") return [EVERYONE_CHILD];

  const saved = safeParse<ChildProfile[]>(window.localStorage.getItem(CHILDREN_KEY), []);
  return [EVERYONE_CHILD, ...cleanChildren(saved)];
}

export function saveChildren(children: ChildProfile[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CHILDREN_KEY, JSON.stringify(cleanChildren(children)));
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

  const nextPlans = getCurrentPlans().map((plan) =>
    plan.assignedTo === childId ? { ...plan, assignedTo: EVERYONE_CHILD.id } : plan
  );
  saveCurrentPlans(nextPlans);

  return getChildren();
}

export function getSavedWeeks(): SavedWeekLog[] {
  if (typeof window === "undefined") return [];
  return safeParse<SavedWeekLog[]>(window.localStorage.getItem(SAVED_WEEKS_KEY), []);
}

export function saveWeekLog(log: SavedWeekLog) {
  if (typeof window === "undefined") return;

  const current = getSavedWeeks();
  const withoutDuplicate = current.filter((item) => item.id !== log.id);
  const next = [log, ...withoutDuplicate];

  window.localStorage.setItem(SAVED_WEEKS_KEY, JSON.stringify(next));
}

export function deleteSavedWeek(weekId: string) {
  if (typeof window === "undefined") return;

  const current = getSavedWeeks();
  const next = current.filter((week) => week.id !== weekId);

  window.localStorage.setItem(SAVED_WEEKS_KEY, JSON.stringify(next));
}

export function clearSavedWeeks() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(SAVED_WEEKS_KEY);
}
