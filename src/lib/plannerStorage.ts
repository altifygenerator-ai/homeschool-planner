import { defaultCategoryDefinitions } from "@/data/demoPlans";
import { getActiveAccountContext } from "@/lib/localAuth";
import { getSupabaseClient } from "@/lib/supabaseClient";
import { getCurrentWeekRange } from "@/lib/week";
import type {
  CategoryDefinition,
  ChildProfile,
  PlanStatus,
  PlannerItem,
  SavedWeekLog,
  WeekDay,
  WeekTemplate,
} from "@/types/planner";

const SAVED_WEEKS_KEY = "softweek_saved_weeks";
const CURRENT_PLANS_KEY = "softweek_current_plans";
const CHILDREN_KEY = "softweek_children";
const ACTIVE_WEEK_START_KEY = "softweek_active_week_start";
const WEEK_PLANS_PREFIX = "softweek_week_plans";
const CATEGORIES_KEY = "softweek_categories";
const WEEK_TEMPLATES_KEY = "softweek_week_templates";

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

function localGet<T>(key: string, fallback: T) {
  if (typeof window === "undefined") return fallback;
  return safeParse<T>(window.localStorage.getItem(key), fallback);
}

function localSet(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

function localRemove(key: string) {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(key);
}

async function getStorageContext() {
  const context = await getActiveAccountContext();
  return {
    context,
    supabase: context?.isGuest ? null : getSupabaseClient(),
    familyId: context?.family.id ?? null,
  };
}

function dbChildToProfile(row: Record<string, unknown>): ChildProfile {
  return {
    id: String(row.id),
    name: String(row.name ?? "Child"),
    colorLabel: (row.color_label as ChildProfile["colorLabel"]) ?? "sage",
  };
}

function dbPlanToPlannerItem(row: Record<string, unknown>): PlannerItem {
  return {
    id: String(row.id),
    title: String(row.title ?? "Untitled plan"),
    day: String(row.day_of_week ?? "Monday") as WeekDay,
    category: String(row.category_slug ?? "other"),
    status: String(row.status ?? "planned") as PlanStatus,
    timeBlock: (String(row.time_block ?? "Anytime") as PlannerItem["timeBlock"]),
    assignedTo: row.assigned_to_child_id ? String(row.assigned_to_child_id) : "everyone",
    weekStart: String(row.week_start ?? ""),
    notes: row.notes ? String(row.notes) : "",
    actualNotes: row.actual_notes ? String(row.actual_notes) : "",
    resourceTitle: row.resource_title ? String(row.resource_title) : "",
    resourceUrl: row.resource_url ? String(row.resource_url) : "",
  };
}

function plannerItemToDb(plan: PlannerItem, familyId: string, weekStart: string) {
  return {
    id: plan.id,
    family_id: familyId,
    week_start: normalizeWeekStart(weekStart),
    title: plan.title,
    day_of_week: plan.day,
    category_slug: plan.category,
    status: plan.status,
    time_block: plan.timeBlock,
    assigned_to_child_id: plan.assignedTo === "everyone" ? null : plan.assignedTo,
    notes: plan.notes ?? "",
    actual_notes: plan.actualNotes ?? "",
    resource_title: plan.resourceTitle ?? "",
    resource_url: plan.resourceUrl ?? "",
    updated_at: new Date().toISOString(),
    deleted_at: null,
  };
}

function savedWeekFromDb(row: Record<string, unknown>): SavedWeekLog {
  const snapshot = (row.snapshot ?? {}) as Partial<SavedWeekLog>;

  return {
    id: String(row.id),
    weekLabel: String(row.week_label ?? snapshot.weekLabel ?? "Saved week"),
    weekStart: String(row.week_start ?? snapshot.weekStart ?? ""),
    weekEnd: String(row.week_end ?? snapshot.weekEnd ?? ""),
    savedAt: String(row.saved_at ?? snapshot.savedAt ?? new Date().toISOString()),
    children: (snapshot.children ?? []) as ChildProfile[],
    childSummaries: snapshot.childSummaries ?? [],
    plans: snapshot.plans ?? [],
  };
}

function dbTemplateToWeekTemplate(row: Record<string, unknown>): WeekTemplate {
  const plans = Array.isArray(row.plans) ? row.plans : [];

  return {
    id: String(row.id),
    name: String(row.name ?? "Saved week template"),
    createdAt: String(row.created_at ?? new Date().toISOString()),
    updatedAt: row.updated_at ? String(row.updated_at) : undefined,
    plans: plans as PlannerItem[],
  };
}

function cleanTemplatePlans(plans: PlannerItem[]) {
  return plans.map((plan) => ({
    ...plan,
    id: plan.id || makeCategoryId(plan.title) || "plan",
    status: "planned" as PlanStatus,
    actualNotes: "",
    weekStart: undefined,
  }));
}

export function getActiveWeekStart() {
  if (typeof window === "undefined") return getCurrentWeekRange().weekStart;

  const saved = window.localStorage.getItem(ACTIVE_WEEK_START_KEY);
  return saved || getCurrentWeekRange().weekStart;
}

export function saveActiveWeekStart(weekStart: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ACTIVE_WEEK_START_KEY, normalizeWeekStart(weekStart));
}

export async function getPlansForWeek(weekStart: string): Promise<PlannerItem[]> {
  if (typeof window === "undefined") return [];

  const { context, supabase, familyId } = await getStorageContext();

  if (!context || context.isGuest || !supabase || !familyId) {
    const nextPlans = localGet<PlannerItem[]>(weekPlansKey(weekStart), []);
    if (nextPlans.length) return nextPlans;

    const legacyPlans = localGet<PlannerItem[]>(CURRENT_PLANS_KEY, []);

    if (
      legacyPlans.length &&
      normalizeWeekStart(weekStart) === normalizeWeekStart(getCurrentWeekRange().weekStart)
    ) {
      return legacyPlans.map((plan) => ({ ...plan, weekStart }));
    }

    return [];
  }

  let query = supabase
    .from("planner_items")
    .select("*")
    .eq("family_id", familyId)
    .eq("week_start", normalizeWeekStart(weekStart))
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (context.isChild && context.session.childId) {
    query = query.or(`assigned_to_child_id.is.null,assigned_to_child_id.eq.${context.session.childId}`);
  }

  const { data, error } = await query;
  if (error) throw error;

  return (data ?? []).map(dbPlanToPlannerItem);
}

export async function savePlansForWeek(weekStart: string, plans: PlannerItem[]) {
  if (typeof window === "undefined") return;

  const { context, supabase, familyId } = await getStorageContext();
  const stampedPlans = plans.map((plan) => ({ ...plan, weekStart }));

  if (!context || context.isGuest || !supabase || !familyId) {
    localSet(weekPlansKey(weekStart), stampedPlans);

    if (normalizeWeekStart(weekStart) === normalizeWeekStart(getCurrentWeekRange().weekStart)) {
      localSet(CURRENT_PLANS_KEY, stampedPlans);
    }

    return;
  }

  if (context.isChild) {
    return;
  }

  const { error: clearExistingError } = await supabase
    .from("planner_items")
    .update({ deleted_at: new Date().toISOString() })
    .eq("family_id", familyId)
    .eq("week_start", normalizeWeekStart(weekStart));

  if (clearExistingError) throw clearExistingError;

  if (!stampedPlans.length) return;

  const { error } = await supabase
    .from("planner_items")
    .upsert(stampedPlans.map((plan) => plannerItemToDb(plan, familyId, weekStart)), {
      onConflict: "id",
    });

  if (error) throw error;
}

export async function updatePlanProgress({
  id,
  status,
  actualNotes,
}: {
  id: string;
  status?: PlanStatus;
  actualNotes?: string;
}) {
  const { context, supabase, familyId } = await getStorageContext();
  if (!context || context.isGuest || !supabase || !familyId) return;

  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (status) update.status = status;
  if (actualNotes !== undefined) update.actual_notes = actualNotes;

  let query = supabase
    .from("planner_items")
    .update(update)
    .eq("id", id)
    .eq("family_id", familyId);

  if (context.isChild && context.session.childId) {
    query = query.or(`assigned_to_child_id.is.null,assigned_to_child_id.eq.${context.session.childId}`);
  }

  const { error } = await query;
  if (error) throw error;
}

export async function clearPlansForWeek(weekStart: string) {
  const { context, supabase, familyId } = await getStorageContext();

  if (!context || context.isGuest || !supabase || !familyId) {
    localRemove(weekPlansKey(weekStart));

    if (normalizeWeekStart(weekStart) === normalizeWeekStart(getCurrentWeekRange().weekStart)) {
      localRemove(CURRENT_PLANS_KEY);
    }

    return;
  }

  if (context.isChild) return;

  const { error } = await supabase
    .from("planner_items")
    .update({ deleted_at: new Date().toISOString() })
    .eq("family_id", familyId)
    .eq("week_start", normalizeWeekStart(weekStart));

  if (error) throw error;
}

export async function getCurrentPlans(): Promise<PlannerItem[]> {
  return getPlansForWeek(getActiveWeekStart());
}

export async function saveCurrentPlans(plans: PlannerItem[]) {
  return savePlansForWeek(getActiveWeekStart(), plans);
}

export async function clearCurrentPlans() {
  return clearPlansForWeek(getActiveWeekStart());
}

export async function getChildren(): Promise<ChildProfile[]> {
  if (typeof window === "undefined") return [EVERYONE_CHILD];

  const { context, supabase, familyId } = await getStorageContext();

  if (!context || context.isGuest || !supabase || !familyId) {
    const saved = localGet<ChildProfile[]>(CHILDREN_KEY, []);
    return [EVERYONE_CHILD, ...cleanChildren(saved)];
  }

  let query = supabase
    .from("children")
    .select("*")
    .eq("family_id", familyId)
    .is("archived_at", null)
    .order("created_at", { ascending: true });

  if (context.isChild && context.session.childId) {
    query = query.eq("id", context.session.childId);
  }

  const { data, error } = await query;
  if (error) throw error;

  return [EVERYONE_CHILD, ...(data ?? []).map(dbChildToProfile)];
}

export async function saveChildren(children: ChildProfile[]) {
  const cleaned = cleanChildren(children);
  const { context, supabase, familyId } = await getStorageContext();

  if (!context || context.isGuest || !supabase || !familyId) {
    localSet(CHILDREN_KEY, cleaned);
    return;
  }

  if (!context.isParent) return;

  const { error } = await supabase.from("children").upsert(
    cleaned.map((child) => ({
      id: child.id,
      family_id: familyId,
      name: child.name,
      color_label: child.colorLabel ?? "sage",
      archived_at: null,
      updated_at: new Date().toISOString(),
    })),
    { onConflict: "id" }
  );

  if (error) throw error;
}

export async function renameChildProfile(childId: string, name: string) {
  const { context, supabase, familyId } = await getStorageContext();

  if (!context || context.isGuest || !supabase || !familyId) {
    const next = (await getChildren()).map((child) =>
      child.id === childId ? { ...child, name: name.trim() || child.name } : child
    );

    await saveChildren(next);
    return getChildren();
  }

  if (!context.isParent) return getChildren();

  const { error } = await supabase
    .from("children")
    .update({ name: name.trim(), updated_at: new Date().toISOString() })
    .eq("id", childId)
    .eq("family_id", familyId);

  if (error) throw error;
  return getChildren();
}

export async function deleteChildProfile(childId: string) {
  if (childId === EVERYONE_CHILD.id) return getChildren();

  const { context, supabase, familyId } = await getStorageContext();

  if (!context || context.isGuest || !supabase || !familyId) {
    const nextChildren = (await getChildren()).filter((child) => child.id !== childId);
    await saveChildren(nextChildren);

    const activeWeekStart = getActiveWeekStart();
    const nextPlans = (await getPlansForWeek(activeWeekStart)).map((plan) =>
      plan.assignedTo === childId ? { ...plan, assignedTo: EVERYONE_CHILD.id } : plan
    );
    await savePlansForWeek(activeWeekStart, nextPlans);

    return getChildren();
  }

  if (!context.isParent) return getChildren();

  // Archive instead of hard-deleting so saved records and future plan changes never erase a family's history.
  const { error } = await supabase
    .from("children")
    .update({ archived_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("id", childId)
    .eq("family_id", familyId);

  if (error) throw error;

  await supabase
    .from("planner_items")
    .update({ assigned_to_child_id: null, updated_at: new Date().toISOString() })
    .eq("family_id", familyId)
    .eq("assigned_to_child_id", childId)
    .is("deleted_at", null);

  return getChildren();
}

export async function getCategoryDefinitions(): Promise<CategoryDefinition[]> {
  const { context, supabase, familyId } = await getStorageContext();

  if (!context || context.isGuest || !supabase || !familyId) {
    const saved = localGet<CategoryDefinition[]>(CATEGORIES_KEY, []);

    const customOnly = cleanCategories(saved).filter(
      (savedCategory) =>
        !defaultCategoryDefinitions.some(
          (defaultCategory) => defaultCategory.id === savedCategory.id
        )
    );

    return [...defaultCategoryDefinitions, ...customOnly];
  }

  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("family_id", familyId)
    .order("created_at", { ascending: true });

  if (error) throw error;

  const customOnly = (data ?? [])
    .map((row) => ({
      id: String(row.slug),
      label: String(row.label),
      isCustom: true,
    }))
    .filter(
      (savedCategory) =>
        !defaultCategoryDefinitions.some(
          (defaultCategory) => defaultCategory.id === savedCategory.id
        )
    );

  return [...defaultCategoryDefinitions, ...customOnly];
}

export async function saveCategoryDefinitions(categories: CategoryDefinition[]) {
  const customOnly = cleanCategories(categories).filter(
    (category) =>
      category.isCustom &&
      !defaultCategoryDefinitions.some(
        (defaultCategory) => defaultCategory.id === category.id
      )
  );

  const { context, supabase, familyId } = await getStorageContext();

  if (!context || context.isGuest || !supabase || !familyId) {
    localSet(CATEGORIES_KEY, customOnly);
    return;
  }

  if (!context.isParent) return;

  if (!customOnly.length) return;

  const { error } = await supabase.from("categories").upsert(
    customOnly.map((category) => ({
      family_id: familyId,
      slug: category.id,
      label: category.label,
      is_custom: true,
      updated_at: new Date().toISOString(),
    })),
    { onConflict: "family_id,slug" }
  );

  if (error) throw error;
}

export async function addCategoryDefinition(name: string) {
  const label = name.trim();
  if (!label) return (await getCategoryDefinitions())[0];

  const current = await getCategoryDefinitions();
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

  await saveCategoryDefinitions([...current, nextCategory]);
  return nextCategory;
}

export async function deleteCategoryDefinition(categoryId: string) {
  const { context, supabase, familyId } = await getStorageContext();

  if (!context || context.isGuest || !supabase || !familyId) {
    const next = (await getCategoryDefinitions()).filter(
      (category) => category.id !== categoryId || !category.isCustom
    );

    await saveCategoryDefinitions(next);
    return getCategoryDefinitions();
  }

  if (!context.isParent) return getCategoryDefinitions();

  const { error } = await supabase
    .from("categories")
    .delete()
    .eq("family_id", familyId)
    .eq("slug", categoryId);

  if (error) throw error;
  return getCategoryDefinitions();
}

export async function getSavedWeeks(): Promise<SavedWeekLog[]> {
  if (typeof window === "undefined") return [];

  const { context, supabase, familyId } = await getStorageContext();

  if (!context || context.isGuest || !supabase || !familyId) {
    return localGet<SavedWeekLog[]>(SAVED_WEEKS_KEY, []);
  }

  const { data, error } = await supabase
    .from("saved_weeks")
    .select("*")
    .eq("family_id", familyId)
    .is("deleted_at", null)
    .order("saved_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).map(savedWeekFromDb);
}

export async function saveWeekLog(log: SavedWeekLog) {
  const { context, supabase, familyId } = await getStorageContext();

  if (!context || context.isGuest || !supabase || !familyId) {
    const current = await getSavedWeeks();
    const withoutDuplicate = current.filter((item) => item.id !== log.id);
    localSet(SAVED_WEEKS_KEY, [log, ...withoutDuplicate]);
    return;
  }

  if (!context.isParent) return;

  const { error } = await supabase.from("saved_weeks").upsert(
    {
      id: log.id,
      family_id: familyId,
      week_label: log.weekLabel,
      week_start: normalizeWeekStart(log.weekStart),
      week_end: normalizeWeekStart(log.weekEnd),
      saved_at: log.savedAt,
      snapshot: log,
      period_type: "week",
      period_start: normalizeWeekStart(log.weekStart),
      period_end: normalizeWeekStart(log.weekEnd),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" }
  );

  if (error) throw error;
}

export async function deleteSavedWeek(weekId: string) {
  const { context, supabase, familyId } = await getStorageContext();

  if (!context || context.isGuest || !supabase || !familyId) {
    const current = await getSavedWeeks();
    localSet(SAVED_WEEKS_KEY, current.filter((week) => week.id !== weekId));
    return;
  }

  if (!context.isParent) return;

  const { error } = await supabase
    .from("saved_weeks")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", weekId)
    .eq("family_id", familyId);

  if (error) throw error;
}

export async function getWeekTemplates(): Promise<WeekTemplate[]> {
  if (typeof window === "undefined") return [];

  const { context, supabase, familyId } = await getStorageContext();

  if (!context || context.isGuest || !supabase || !familyId) {
    return localGet<WeekTemplate[]>(WEEK_TEMPLATES_KEY, []);
  }

  const { data, error } = await supabase
    .from("week_templates")
    .select("*")
    .eq("family_id", familyId)
    .is("deleted_at", null)
    .order("updated_at", { ascending: false });

  if (error) {
    // Keeps the planner usable if the Beta 1.3 template migration has not been run yet.
    if (error.message.toLowerCase().includes("week_templates")) return [];
    throw error;
  }

  return (data ?? []).map(dbTemplateToWeekTemplate);
}

export async function saveWeekTemplate(template: WeekTemplate) {
  const cleanedTemplate: WeekTemplate = {
    ...template,
    name: template.name.trim() || "Saved week template",
    plans: cleanTemplatePlans(template.plans),
    updatedAt: new Date().toISOString(),
  };

  const { context, supabase, familyId } = await getStorageContext();

  if (!context || context.isGuest || !supabase || !familyId) {
    const current = await getWeekTemplates();
    const withoutDuplicate = current.filter((item) => item.id !== cleanedTemplate.id);
    localSet(WEEK_TEMPLATES_KEY, [cleanedTemplate, ...withoutDuplicate]);
    return;
  }

  if (!context.isParent) return;

  const { error } = await supabase.from("week_templates").upsert(
    {
      id: cleanedTemplate.id,
      family_id: familyId,
      name: cleanedTemplate.name,
      plans: cleanedTemplate.plans,
      updated_at: new Date().toISOString(),
      deleted_at: null,
    },
    { onConflict: "id" }
  );

  if (error) throw error;
}

export async function deleteWeekTemplate(templateId: string) {
  const { context, supabase, familyId } = await getStorageContext();

  if (!context || context.isGuest || !supabase || !familyId) {
    const current = await getWeekTemplates();
    localSet(WEEK_TEMPLATES_KEY, current.filter((template) => template.id !== templateId));
    return;
  }

  if (!context.isParent) return;

  const { error } = await supabase
    .from("week_templates")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", templateId)
    .eq("family_id", familyId);

  if (error) throw error;
}

export async function clearSavedWeeks() {
  const { context, supabase, familyId } = await getStorageContext();

  if (!context || context.isGuest || !supabase || !familyId) {
    localRemove(SAVED_WEEKS_KEY);
    return;
  }

  if (!context.isParent) return;

  const { error } = await supabase
    .from("saved_weeks")
    .update({ deleted_at: new Date().toISOString() })
    .eq("family_id", familyId);

  if (error) throw error;
}
