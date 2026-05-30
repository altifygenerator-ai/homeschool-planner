import type { PlannerItem, SavedWeekLog } from "@/types/planner";

const SAVED_WEEKS_KEY = "softweek_saved_weeks";
const CURRENT_PLANS_KEY = "softweek_current_plans";

export function getCurrentPlans(): PlannerItem[] {
  if (typeof window === "undefined") return [];

  try {
    const saved = window.localStorage.getItem(CURRENT_PLANS_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

export function saveCurrentPlans(plans: PlannerItem[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CURRENT_PLANS_KEY, JSON.stringify(plans));
}

export function clearCurrentPlans() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(CURRENT_PLANS_KEY);
}

export function getSavedWeeks(): SavedWeekLog[] {
  if (typeof window === "undefined") return [];

  try {
    const saved = window.localStorage.getItem(SAVED_WEEKS_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
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