import { getSupabaseClient, getSupabaseSession } from "@/lib/supabaseClient";
import { createId } from "@/lib/utils";

export type SoftWeekEventName =
  | "account_created"
  | "child_account_created"
  | "login"
  | "planner_opened"
  | "today_opened"
  | "week_opened"
  | "onboarding_started"
  | "onboarding_completed"
  | "first_item_created"
  | "third_item_created"
  | "first_item_scheduled"
  | "first_item_completed"
  | "week_inbox_item_created"
  | "item_scheduled"
  | "item_carried_forward"
  | "plan_added"
  | "plan_moved"
  | "plan_copied"
  | "plan_deleted"
  | "plan_status_updated"
  | "resource_updated"
  | "week_copied"
  | "last_week_copied"
  | "template_saved"
  | "template_used"
  | "template_deleted"
  | "week_saved"
  | "category_added"
  | "child_added"
  | "first_child_created"
  | "child_updated"
  | "child_removed"
  | "child_invite_created"
  | "life_happened_opened"
  | "life_happened_applied"
  | "life_happened_undone"
  | "rhythm_created"
  | "rhythm_applied"
  | "rhythm_paused"
  | "rhythm_updated"
  | "rhythm_removed"
  | "lesson_stack_created"
  | "lesson_stack_item_completed"
  | "week_closeout_started"
  | "week_closeout_completed"
  | "unfinished_items_carried"
  | "next_week_opened"
  | "next_week_created"
  | "weekly_return"
  | "reminder_sent"
  | "reminder_clicked"
  | "reminder_preferences_updated"
  | "print_opened"
  | "print_clicked"
  | "feedback_submitted"
  | "pwa_installed"
  | "mobile_app_install_accepted"
  | "mobile_app_install_dismissed";

type TrackSoftWeekEventOptions = {
  source?: string;
  childId?: string | null;
  metadata?: Record<string, unknown>;
  incrementLoginCount?: boolean;
};

type ProfileTrackingRow = {
  id: string;
  family_id: string | null;
  child_id: string | null;
};

const SESSION_KEY = "softweek_analytics_session";
const ACQUISITION_KEY = "softweek_acquisition";
const trackingFailures = new Set<string>();
const milestoneEvents = new Set<SoftWeekEventName>([
  "account_created",
  "onboarding_started",
  "onboarding_completed",
  "first_item_created",
  "third_item_created",
  "first_item_scheduled",
  "first_item_completed",
  "first_child_created",
  "pwa_installed",
]);

function sessionId() {
  const existing = window.localStorage.getItem(SESSION_KEY);
  if (existing) return existing;
  const next = createId("session");
  window.localStorage.setItem(SESSION_KEY, next);
  return next;
}

function acquisition() {
  const existing = window.localStorage.getItem(ACQUISITION_KEY);
  if (existing) {
    try { return JSON.parse(existing) as Record<string, string>; } catch { return {}; }
  }
  const params = new URLSearchParams(window.location.search);
  const value = {
    source: params.get("utm_source") ?? "",
    medium: params.get("utm_medium") ?? "",
    campaign: params.get("utm_campaign") ?? "",
    referrer: document.referrer ?? "",
  };
  window.localStorage.setItem(ACQUISITION_KEY, JSON.stringify(value));
  return value;
}

function milestoneKey(eventName: SoftWeekEventName) {
  return `softweek_event_once:${eventName}`;
}

export async function trackSoftWeekEvent(eventName: SoftWeekEventName, options: TrackSoftWeekEventOptions = {}) {
  if (typeof window === "undefined") return;
  if (milestoneEvents.has(eventName) && window.localStorage.getItem(milestoneKey(eventName))) return;

  const supabase = getSupabaseClient();
  const session = await getSupabaseSession();
  const user = session?.user;
  if (!supabase || !user) return;

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, family_id, child_id")
    .eq("id", user.id)
    .maybeSingle();
  const typedProfile = profile as ProfileTrackingRow | null;
  if (profileError || !typedProfile?.family_id) return;

  const now = new Date().toISOString();
  const eventKey = milestoneEvents.has(eventName) ? `${user.id}:${eventName}` : null;

  if (!trackingFailures.has("app_events")) {
    const { error: eventError } = await supabase.from("app_events").insert({
      family_id: typedProfile.family_id,
      user_id: user.id,
      child_id: options.childId ?? typedProfile.child_id ?? null,
      event_name: eventName,
      event_source: options.source ?? null,
      session_id: sessionId(),
      event_key: eventKey,
      metadata: {
        ...options.metadata,
        acquisition: acquisition(),
        path: window.location.pathname,
      },
    });

    if (eventError) {
      if (eventError.code === "23505" && milestoneEvents.has(eventName)) {
        window.localStorage.setItem(milestoneKey(eventName), "1");
      } else {
        trackingFailures.add("app_events");
      }
    } else if (milestoneEvents.has(eventName)) {
      window.localStorage.setItem(milestoneKey(eventName), "1");
    }
  }

  if (!trackingFailures.has("profile_tracking")) {
    const profileUpdates: Record<string, unknown> = {
      last_seen_at: now,
      last_active_feature: eventName,
    };
    if (options.incrementLoginCount) profileUpdates.login_count = await getNextLoginCount(user.id);
    const { error: updateError } = await supabase.from("profiles").update(profileUpdates).eq("id", user.id);
    if (updateError) trackingFailures.add("profile_tracking");
  }
}

async function getNextLoginCount(userId: string) {
  const supabase = getSupabaseClient();
  if (!supabase) return 1;
  const { data } = await supabase.from("profiles").select("login_count").eq("id", userId).maybeSingle();
  const row = data as { login_count?: number | null } | null;
  return Number(row?.login_count ?? 0) + 1;
}
