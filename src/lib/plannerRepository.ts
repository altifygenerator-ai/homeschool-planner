import { getActiveAccountContext } from "@/lib/localAuth";
import { getSupabaseClient } from "@/lib/supabaseClient";
import { enqueuePlannerMutation, replayPlannerQueue as replayQueue } from "@/lib/offlineQueue";
import type {
  LessonStack,
  PlannerItem,
  PlanStatus,
  WeeklyRhythm,
  WeekDay,
} from "@/types/planner";

const WEEK_PLANS_PREFIX = "softweek_week_plans";
const CURRENT_PLANS_KEY = "softweek_current_plans";
const RHYTHMS_KEY = "softweek_weekly_rhythms";
const STACKS_KEY = "softweek_lesson_stacks";

function normalizeWeekStart(value: string) {
  return value.slice(0, 10);
}

function weekPlansKey(weekStart: string) {
  return `${WEEK_PLANS_PREFIX}:${normalizeWeekStart(weekStart)}`;
}

function safeParse<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function localGet<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  return safeParse(window.localStorage.getItem(key), fallback);
}

function localSet(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

async function context() {
  const account = await getActiveAccountContext();
  return {
    account,
    familyId: account?.family.id ?? null,
    supabase: account?.isGuest ? null : getSupabaseClient(),
  };
}

export function normalizePlannerItem(plan: Partial<PlannerItem> & Pick<PlannerItem, "id" | "title">): PlannerItem {
  const day = plan.day ?? null;
  return {
    id: plan.id,
    title: plan.title,
    day,
    placement: plan.placement ?? (day ? "day" : "week"),
    category: plan.category ?? "other",
    status: plan.status ?? "planned",
    timeBlock: plan.timeBlock ?? "Anytime",
    assignedTo: plan.assignedTo ?? "everyone",
    weekStart: plan.weekStart,
    notes: plan.notes ?? "",
    actualNotes: plan.actualNotes ?? "",
    resourceTitle: plan.resourceTitle ?? "",
    resourceUrl: plan.resourceUrl ?? "",
    completedAt: plan.completedAt ?? null,
    actualDate: plan.actualDate ?? null,
    timeSpentMinutes: plan.timeSpentMinutes ?? null,
    orderIndex: plan.orderIndex ?? 0,
    sourceRhythmId: plan.sourceRhythmId ?? null,
    sourceLessonStackItemId: plan.sourceLessonStackItemId ?? null,
    syncState: plan.syncState ?? "saved",
  };
}

function fromDb(row: Record<string, unknown>): PlannerItem {
  const day = row.day_of_week ? String(row.day_of_week) as WeekDay : null;
  return normalizePlannerItem({
    id: String(row.id),
    title: String(row.title ?? "Untitled plan"),
    day,
    placement: row.placement === "week" ? "week" : day ? "day" : "week",
    category: String(row.category_slug ?? "other"),
    status: String(row.status ?? "planned") as PlanStatus,
    timeBlock: String(row.time_block ?? "Anytime") as PlannerItem["timeBlock"],
    assignedTo: row.assigned_to_child_id ? String(row.assigned_to_child_id) : "everyone",
    weekStart: String(row.week_start ?? ""),
    notes: row.notes ? String(row.notes) : "",
    actualNotes: row.actual_notes ? String(row.actual_notes) : "",
    resourceTitle: row.resource_title ? String(row.resource_title) : "",
    resourceUrl: row.resource_url ? String(row.resource_url) : "",
    completedAt: row.completed_at ? String(row.completed_at) : null,
    actualDate: row.actual_date ? String(row.actual_date) : null,
    timeSpentMinutes: row.time_spent_minutes === null || row.time_spent_minutes === undefined
      ? null
      : Number(row.time_spent_minutes),
    orderIndex: Number(row.order_index ?? 0),
    sourceRhythmId: row.source_rhythm_id ? String(row.source_rhythm_id) : null,
    sourceLessonStackItemId: row.source_lesson_stack_item_id ? String(row.source_lesson_stack_item_id) : null,
  });
}

function toDb(plan: PlannerItem, familyId: string, userId: string) {
  const normalized = normalizePlannerItem(plan);
  return {
    id: normalized.id,
    family_id: familyId,
    created_by: userId,
    updated_by: userId,
    week_start: normalizeWeekStart(normalized.weekStart ?? new Date().toISOString()),
    title: normalized.title,
    day_of_week: normalized.placement === "day" ? normalized.day : null,
    placement: normalized.placement,
    category_slug: normalized.category,
    status: normalized.status,
    time_block: normalized.timeBlock,
    assigned_to_child_id: normalized.assignedTo === "everyone" ? null : normalized.assignedTo,
    notes: normalized.notes ?? "",
    actual_notes: normalized.actualNotes ?? "",
    resource_title: normalized.resourceTitle ?? "",
    resource_url: normalized.resourceUrl ?? "",
    completed_at: normalized.completedAt ?? null,
    actual_date: normalized.actualDate ?? null,
    time_spent_minutes: normalized.timeSpentMinutes ?? null,
    order_index: normalized.orderIndex ?? 0,
    source_rhythm_id: normalized.sourceRhythmId ?? null,
    source_lesson_stack_item_id: normalized.sourceLessonStackItemId ?? null,
    deleted_at: null,
    updated_at: new Date().toISOString(),
  };
}

function localPlans(weekStart: string) {
  return localGet<PlannerItem[]>(weekPlansKey(weekStart), []).map(normalizePlannerItem);
}

function browserIsOffline() {
  return typeof navigator !== "undefined" && !navigator.onLine;
}

function saveLocalPlan(plan: PlannerItem) {
  const weekStart = normalizeWeekStart(plan.weekStart ?? "");
  const current = localPlans(weekStart);
  const next = [plan, ...current.filter((item) => item.id !== plan.id)];
  localSet(weekPlansKey(weekStart), next);
  localSet(CURRENT_PLANS_KEY, next);
}

function removeLocalPlan(id: string, weekStart: string) {
  const normalizedWeek = normalizeWeekStart(weekStart);
  const next = localPlans(normalizedWeek).filter((item) => item.id !== id);
  localSet(weekPlansKey(normalizedWeek), next);
  localSet(CURRENT_PLANS_KEY, next);
}

export async function readPlannerWeek(weekStart: string): Promise<PlannerItem[]> {
  const { account, familyId, supabase } = await context();
  if (!account || account.isGuest || !familyId || !supabase) return localPlans(weekStart);

  let query = supabase
    .from("planner_items")
    .select("*")
    .eq("family_id", familyId)
    .eq("week_start", normalizeWeekStart(weekStart))
    .is("deleted_at", null)
    .order("order_index", { ascending: true })
    .order("created_at", { ascending: true });

  if (account.isChild && account.session.childId) {
    query = query.or(`assigned_to_child_id.is.null,assigned_to_child_id.eq.${account.session.childId}`);
  }

  const { data, error } = await query;
  if (error) {
    const cached = localPlans(weekStart);
    if (browserIsOffline() && cached.length) return cached.map((item) => ({ ...item, syncState: "queued" }));
    throw error;
  }
  const plans = ((data ?? []) as Record<string, unknown>[]).map((row) => fromDb(row));
  localSet(weekPlansKey(weekStart), plans);
  localSet(CURRENT_PLANS_KEY, plans);
  return plans;
}

export async function createPlannerItem(plan: PlannerItem): Promise<PlannerItem> {
  const normalized = normalizePlannerItem(plan);
  const { account, familyId, supabase } = await context();
  if (!account || account.isGuest || !familyId || !supabase) {
    saveLocalPlan(normalized);
    return normalized;
  }
  if (!account.isParent) throw new Error("Only a parent account can add plans.");
  const row = toDb(normalized, familyId, account.account.id);
  if (browserIsOffline()) {
    await enqueuePlannerMutation({ kind: "upsert", familyId, plannerItemId: normalized.id, payload: row });
    saveLocalPlan({ ...normalized, syncState: "queued" });
    return { ...normalized, syncState: "queued" as const };
  }
  const { error } = await supabase.from("planner_items").upsert(row, { onConflict: "id" });
  if (error) throw error;
  saveLocalPlan(normalized);
  return normalized;
}

export async function updatePlannerItem(id: string, patch: Partial<PlannerItem>, fallback?: PlannerItem): Promise<PlannerItem | null> {
  const { account, familyId, supabase } = await context();
  if (!account || account.isGuest || !familyId || !supabase) {
    if (!fallback) throw new Error("The plan could not be found.");
    const next = normalizePlannerItem({ ...fallback, ...patch, id, title: patch.title ?? fallback.title });
    if (fallback.weekStart && next.weekStart && normalizeWeekStart(fallback.weekStart) !== normalizeWeekStart(next.weekStart)) removeLocalPlan(id, fallback.weekStart);
    saveLocalPlan(next);
    return next;
  }

  const dbPatch: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
    updated_by: account.account.id,
  };
  if (patch.title !== undefined) dbPatch.title = patch.title;
  if (patch.weekStart !== undefined) dbPatch.week_start = normalizeWeekStart(patch.weekStart);
  if (patch.day !== undefined) dbPatch.day_of_week = patch.day;
  if (patch.placement !== undefined) dbPatch.placement = patch.placement;
  if (patch.category !== undefined) dbPatch.category_slug = patch.category;
  if (patch.status !== undefined) dbPatch.status = patch.status;
  if (patch.timeBlock !== undefined) dbPatch.time_block = patch.timeBlock;
  if (patch.assignedTo !== undefined) dbPatch.assigned_to_child_id = patch.assignedTo === "everyone" ? null : patch.assignedTo;
  if (patch.notes !== undefined) dbPatch.notes = patch.notes;
  if (patch.actualNotes !== undefined) dbPatch.actual_notes = patch.actualNotes;
  if (patch.resourceTitle !== undefined) dbPatch.resource_title = patch.resourceTitle;
  if (patch.resourceUrl !== undefined) dbPatch.resource_url = patch.resourceUrl;
  if (patch.completedAt !== undefined) dbPatch.completed_at = patch.completedAt;
  if (patch.actualDate !== undefined) dbPatch.actual_date = patch.actualDate;
  if (patch.timeSpentMinutes !== undefined) dbPatch.time_spent_minutes = patch.timeSpentMinutes;
  if (patch.orderIndex !== undefined) dbPatch.order_index = patch.orderIndex;
  if (patch.sourceRhythmId !== undefined) dbPatch.source_rhythm_id = patch.sourceRhythmId;
  if (patch.sourceLessonStackItemId !== undefined) dbPatch.source_lesson_stack_item_id = patch.sourceLessonStackItemId;

  if (browserIsOffline()) {
    if (!fallback) throw new Error("The plan could not be found for offline editing.");
    await enqueuePlannerMutation({ kind: "update", familyId, plannerItemId: id, payload: dbPatch });
    const next = normalizePlannerItem({ ...fallback, ...patch, id, title: patch.title ?? fallback.title, syncState: "queued" });
    if (fallback.weekStart && next.weekStart && normalizeWeekStart(fallback.weekStart) !== normalizeWeekStart(next.weekStart)) removeLocalPlan(id, fallback.weekStart);
    saveLocalPlan(next);
    return next;
  }

  let query = supabase.from("planner_items").update(dbPatch).eq("id", id).eq("family_id", familyId);
  if (account.isChild && account.session.childId) {
    query = query.or(`assigned_to_child_id.is.null,assigned_to_child_id.eq.${account.session.childId}`);
  }
  const { error } = await query;
  if (error) throw error;
  const next = fallback ? normalizePlannerItem({ ...fallback, ...patch, id, title: patch.title ?? fallback.title }) : null;
  if (next) {
    if (fallback?.weekStart && next.weekStart && normalizeWeekStart(fallback.weekStart) !== normalizeWeekStart(next.weekStart)) removeLocalPlan(id, fallback.weekStart);
    saveLocalPlan(next);
  }
  return next;
}

export function movePlannerItem(id: string, plan: PlannerItem, day: WeekDay | null, weekStart = plan.weekStart ?? "") {
  return updatePlannerItem(id, {
    day,
    placement: day ? "day" : "week",
    weekStart,
    status: plan.status === "done" ? "done" : "moved",
  }, plan);
}

export function completePlannerItem(id: string, plan: PlannerItem, actualDate = new Date().toISOString().slice(0, 10)) {
  return updatePlannerItem(id, { status: "done", completedAt: new Date().toISOString(), actualDate }, plan);
}

export function skipPlannerItem(id: string, plan: PlannerItem) {
  return updatePlannerItem(id, { status: "skipped", completedAt: null }, plan);
}

export function restorePlannerItem(id: string, plan: PlannerItem) {
  return updatePlannerItem(id, { status: "planned", completedAt: null, actualDate: null }, plan);
}

export async function deletePlannerItem(id: string, fallback?: PlannerItem) {
  const { account, familyId, supabase } = await context();
  if (!account || account.isGuest || !familyId || !supabase) {
    if (!fallback?.weekStart) return;
    const next = localPlans(fallback.weekStart).filter((item) => item.id !== id);
    localSet(weekPlansKey(fallback.weekStart), next);
    localSet(CURRENT_PLANS_KEY, next);
    return;
  }
  if (!account.isParent) throw new Error("Only a parent account can delete plans.");
  const payload = {
    deleted_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    updated_by: account.account.id,
  };
  if (browserIsOffline()) {
    await enqueuePlannerMutation({ kind: "soft_delete", familyId, plannerItemId: id, payload });
    if (fallback?.weekStart) {
      const next = localPlans(fallback.weekStart).filter((item) => item.id !== id);
      localSet(weekPlansKey(fallback.weekStart), next);
      localSet(CURRENT_PLANS_KEY, next);
    }
    return;
  }
  const { error } = await supabase.from("planner_items").update(payload).eq("id", id).eq("family_id", familyId);
  if (error) throw error;
  if (fallback?.weekStart) {
    const next = localPlans(fallback.weekStart).filter((item) => item.id !== id);
    localSet(weekPlansKey(fallback.weekStart), next);
    localSet(CURRENT_PLANS_KEY, next);
  }
}

export async function bulkMovePlannerItems(changes: Array<{ id: string; plan: PlannerItem; patch: Partial<PlannerItem> }>) {
  const { account, familyId, supabase } = await context();
  if (account && !account.isGuest && familyId && supabase && account.isParent) {
    if (browserIsOffline()) {
      const queued: PlannerItem[] = [];
      for (const change of changes) {
        const result = await updatePlannerItem(change.id, change.patch, change.plan);
        if (result) queued.push(result);
      }
      return queued;
    }
    const { data, error } = await supabase.rpc("softweek_bulk_move_planner_items", {
      p_changes: changes.map((change) => ({
        id: change.id,
        weekStart: change.patch.weekStart ?? change.plan.weekStart,
        day: change.patch.day ?? null,
        placement: change.patch.placement ?? change.plan.placement,
        status: change.patch.status ?? change.plan.status,
        fromWeekStart: change.plan.weekStart,
        fromDay: change.plan.day,
      })),
      p_event_name: "bulk_move",
    });
    if (!error) return ((data ?? []) as Record<string, unknown>[]).map((row) => fromDb(row));
    if (!error.message.toLowerCase().includes("softweek_bulk_move_planner_items")) throw error;
  }

  const results: PlannerItem[] = [];
  for (const change of changes) {
    const result = await updatePlannerItem(change.id, change.patch, change.plan);
    if (result) results.push(result);
  }
  return results;
}

export async function reorderPlannerItems(items: PlannerItem[]) {
  await Promise.all(items.map((item, index) => updatePlannerItem(item.id, { orderIndex: index }, item)));
}

function rhythmFromDb(row: Record<string, unknown>): WeeklyRhythm {
  return {
    id: String(row.id),
    name: String(row.name ?? row.title ?? "Weekly rhythm"),
    title: String(row.title ?? "Untitled rhythm"),
    weekdays: Array.isArray(row.weekdays) ? row.weekdays as WeekDay[] : [],
    assignedTo: row.assigned_to_child_id ? String(row.assigned_to_child_id) : "everyone",
    category: String(row.category_slug ?? "other"),
    timeBlock: String(row.time_block ?? "Anytime") as WeeklyRhythm["timeBlock"],
    notes: row.notes ? String(row.notes) : "",
    resourceTitle: row.resource_title ? String(row.resource_title) : "",
    resourceUrl: row.resource_url ? String(row.resource_url) : "",
    startWeek: String(row.start_week ?? ""),
    endWeek: row.end_week ? String(row.end_week) : null,
    active: Boolean(row.active ?? true),
    createdAt: String(row.created_at ?? new Date().toISOString()),
    updatedAt: row.updated_at ? String(row.updated_at) : undefined,
  };
}

export async function readWeeklyRhythms(): Promise<WeeklyRhythm[]> {
  const { account, familyId, supabase } = await context();
  if (!account || account.isGuest || !familyId || !supabase) return localGet<WeeklyRhythm[]>(RHYTHMS_KEY, []);
  const { data, error } = await supabase
    .from("weekly_rhythms")
    .select("*")
    .eq("family_id", familyId)
    .is("deleted_at", null)
    .order("created_at", { ascending: true });
  if (error) {
    if (error.message.toLowerCase().includes("weekly_rhythms")) return [];
    throw error;
  }
  return ((data ?? []) as Record<string, unknown>[]).map((row) => rhythmFromDb(row));
}

export async function saveWeeklyRhythm(rhythm: WeeklyRhythm) {
  const { account, familyId, supabase } = await context();
  if (!account || account.isGuest || !familyId || !supabase) {
    const current = localGet<WeeklyRhythm[]>(RHYTHMS_KEY, []);
    localSet(RHYTHMS_KEY, [rhythm, ...current.filter((item) => item.id !== rhythm.id)]);
    return;
  }
  if (!account.isParent) throw new Error("Only a parent account can change weekly rhythms.");
  const { error } = await supabase.from("weekly_rhythms").upsert({
    id: rhythm.id,
    family_id: familyId,
    name: rhythm.name,
    title: rhythm.title,
    weekdays: rhythm.weekdays,
    assigned_to_child_id: rhythm.assignedTo === "everyone" ? null : rhythm.assignedTo,
    category_slug: rhythm.category,
    time_block: rhythm.timeBlock,
    notes: rhythm.notes ?? "",
    resource_title: rhythm.resourceTitle ?? "",
    resource_url: rhythm.resourceUrl ?? "",
    start_week: normalizeWeekStart(rhythm.startWeek),
    end_week: rhythm.endWeek ? normalizeWeekStart(rhythm.endWeek) : null,
    active: rhythm.active,
    deleted_at: null,
    updated_at: new Date().toISOString(),
  }, { onConflict: "id" });
  if (error) throw error;
}

export async function readLessonStacks(): Promise<LessonStack[]> {
  const { account, familyId, supabase } = await context();
  if (!account || account.isGuest || !familyId || !supabase) return localGet<LessonStack[]>(STACKS_KEY, []);
  const { data: stacks, error } = await supabase
    .from("lesson_stacks")
    .select("*")
    .eq("family_id", familyId)
    .is("deleted_at", null)
    .order("created_at", { ascending: true });
  if (error) {
    if (error.message.toLowerCase().includes("lesson_stacks")) return [];
    throw error;
  }
  if (!stacks?.length) return [];
  const stackRows = stacks as Record<string, unknown>[];
  const ids = stackRows.map((row) => String(row.id));
  const { data: items, error: itemError } = await supabase
    .from("lesson_stack_items")
    .select("*")
    .in("stack_id", ids)
    .is("deleted_at", null)
    .order("position", { ascending: true });
  if (itemError) throw itemError;
  const itemRows = (items ?? []) as Record<string, unknown>[];
  return stackRows.map((row) => ({
    id: String(row.id),
    name: String(row.name ?? "Lesson stack"),
    assignedTo: row.assigned_to_child_id ? String(row.assigned_to_child_id) : "everyone",
    category: String(row.category_slug ?? "other"),
    active: Boolean(row.active ?? true),
    createdAt: String(row.created_at ?? new Date().toISOString()),
    updatedAt: row.updated_at ? String(row.updated_at) : undefined,
    items: itemRows.filter((item) => String(item.stack_id) === String(row.id)).map((item) => ({
      id: String(item.id),
      title: String(item.title ?? "Lesson"),
      position: Number(item.position ?? 0),
      status: String(item.status ?? "queued") as LessonStack["items"][number]["status"],
      plannerItemId: item.planner_item_id ? String(item.planner_item_id) : null,
      completedAt: item.completed_at ? String(item.completed_at) : null,
    })),
  }));
}

export async function saveLessonStack(stack: LessonStack) {
  const { account, familyId, supabase } = await context();
  if (!account || account.isGuest || !familyId || !supabase) {
    const current = localGet<LessonStack[]>(STACKS_KEY, []);
    localSet(STACKS_KEY, [stack, ...current.filter((item) => item.id !== stack.id)]);
    return;
  }
  if (!account.isParent) throw new Error("Only a parent account can change lesson stacks.");
  const { error } = await supabase.from("lesson_stacks").upsert({
    id: stack.id,
    family_id: familyId,
    name: stack.name,
    assigned_to_child_id: stack.assignedTo === "everyone" ? null : stack.assignedTo,
    category_slug: stack.category,
    active: stack.active,
    deleted_at: null,
    updated_at: new Date().toISOString(),
  }, { onConflict: "id" });
  if (error) throw error;
  const { error: itemsError } = await supabase.from("lesson_stack_items").upsert(
    stack.items.map((item) => ({
      id: item.id,
      stack_id: stack.id,
      family_id: familyId,
      title: item.title,
      position: item.position,
      status: item.status,
      planner_item_id: item.plannerItemId ?? null,
      completed_at: item.completedAt ?? null,
      deleted_at: null,
      updated_at: new Date().toISOString(),
    })),
    { onConflict: "id" },
  );
  if (itemsError) throw itemsError;
}


export async function replayOfflinePlannerChanges() {
  const { account, supabase } = await context();
  if (!account || account.isGuest || !supabase) return 0;
  return replayQueue(supabase);
}
