import { getActiveAccountContext } from "@/lib/localAuth";
import { getSupabaseClient } from "@/lib/supabaseClient";
import type { NotificationPreferences } from "@/types/planner";

const LOCAL_KEY = "softweek_notification_preferences";

export function defaultNotificationPreferences(): NotificationPreferences {
  const detectedTimezone = typeof window !== "undefined" && typeof Intl !== "undefined"
    ? Intl.DateTimeFormat().resolvedOptions().timeZone
    : "America/Chicago";

  return {
    timezone: detectedTimezone || "America/Chicago",
    emailEnabled: false,
    weeklySetupEnabled: true,
    weeklySetupDay: 0,
    morningTodayEnabled: false,
    closeoutEnabled: true,
    inactivityEnabled: true,
  };
}

function fromRow(row: Record<string, unknown> | null): NotificationPreferences {
  const defaults = defaultNotificationPreferences();
  if (!row) return defaults;
  return {
    timezone: String(row.timezone ?? defaults.timezone),
    emailEnabled: Boolean(row.email_enabled),
    weeklySetupEnabled: row.weekly_setup_enabled === undefined ? defaults.weeklySetupEnabled : Boolean(row.weekly_setup_enabled),
    weeklySetupDay: Number(row.weekly_setup_day ?? defaults.weeklySetupDay),
    morningTodayEnabled: Boolean(row.morning_today_enabled),
    closeoutEnabled: row.closeout_enabled === undefined ? defaults.closeoutEnabled : Boolean(row.closeout_enabled),
    inactivityEnabled: row.inactivity_enabled === undefined ? defaults.inactivityEnabled : Boolean(row.inactivity_enabled),
  };
}

export async function readNotificationPreferences(): Promise<NotificationPreferences> {
  const defaults = defaultNotificationPreferences();
  const account = await getActiveAccountContext();
  const supabase = getSupabaseClient();

  if (!account || account.isGuest || !supabase) {
    if (typeof window === "undefined") return defaults;
    try {
      return { ...defaults, ...JSON.parse(window.localStorage.getItem(LOCAL_KEY) || "{}") } as NotificationPreferences;
    } catch {
      return defaults;
    }
  }

  const { data, error } = await supabase
    .from("notification_preferences")
    .select("*")
    .eq("family_id", account.family.id)
    .maybeSingle();

  if (error) throw error;
  return fromRow(data as Record<string, unknown> | null);
}

export async function saveNotificationPreferences(preferences: NotificationPreferences) {
  const account = await getActiveAccountContext();
  const supabase = getSupabaseClient();

  if (!account || account.isGuest || !supabase) {
    if (typeof window !== "undefined") window.localStorage.setItem(LOCAL_KEY, JSON.stringify(preferences));
    return;
  }

  if (!account.isParent) throw new Error("Only a parent account can change reminder settings.");

  const { error } = await supabase.from("notification_preferences").upsert({
    family_id: account.family.id,
    timezone: preferences.timezone,
    email_enabled: preferences.emailEnabled,
    weekly_setup_enabled: preferences.weeklySetupEnabled,
    weekly_setup_day: preferences.weeklySetupDay,
    morning_today_enabled: preferences.morningTodayEnabled,
    closeout_enabled: preferences.closeoutEnabled,
    inactivity_enabled: preferences.inactivityEnabled,
    updated_at: new Date().toISOString(),
  }, { onConflict: "family_id" });

  if (error) throw error;
}
