import { getSupabaseClient, getSupabaseSession } from "@/lib/supabaseClient";

export type SoftWeekEventName =
  | "account_created"
  | "child_account_created"
  | "login"
  | "planner_opened"
  | "week_opened"
  | "plan_added"
  | "plan_moved"
  | "plan_copied"
  | "plan_status_updated"
  | "resource_updated"
  | "week_copied"
  | "template_saved"
  | "template_used"
  | "template_deleted"
  | "week_saved"
  | "category_added"
  | "child_added"
  | "child_updated"
  | "child_removed"
  | "child_invite_created"
  | "print_opened"
  | "print_clicked"
  | "feedback_submitted"
  | "mobile_app_install_accepted"
  | "mobile_app_install_dismissed"
  | "mobile_app_installed";

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

const trackingFailures = new Set<string>();

function shouldSkipAfterFailure(key: string) {
  return trackingFailures.has(key);
}

function rememberFailure(key: string) {
  trackingFailures.add(key);
}

export async function trackSoftWeekEvent(
  eventName: SoftWeekEventName,
  options: TrackSoftWeekEventOptions = {}
) {
  if (typeof window === "undefined") return;

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

  if (!shouldSkipAfterFailure("app_events")) {
    const { error: eventError } = await supabase.from("app_events").insert({
      family_id: typedProfile.family_id,
      user_id: user.id,
      child_id: options.childId ?? typedProfile.child_id ?? null,
      event_name: eventName,
      event_source: options.source ?? null,
      metadata: options.metadata ?? {},
    });

    if (eventError) {
      rememberFailure("app_events");
    }
  }

  if (!shouldSkipAfterFailure("profile_tracking")) {
    const profileUpdates: Record<string, unknown> = {
      last_seen_at: now,
      last_active_feature: eventName,
    };

    if (options.incrementLoginCount) {
      profileUpdates.login_count = await getNextLoginCount(user.id);
    }

    const { error: updateError } = await supabase
      .from("profiles")
      .update(profileUpdates)
      .eq("id", user.id);

    if (updateError) {
      rememberFailure("profile_tracking");
    }
  }
}

async function getNextLoginCount(userId: string) {
  const supabase = getSupabaseClient();
  if (!supabase) return 1;

  const { data } = await supabase
    .from("profiles")
    .select("login_count")
    .eq("id", userId)
    .maybeSingle();

  const row = data as { login_count?: number | null } | null;
  return Number(row?.login_count ?? 0) + 1;
}
