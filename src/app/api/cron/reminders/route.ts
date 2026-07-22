import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type PreferenceRow = {
  family_id: string;
  timezone: string;
  email_enabled: boolean;
  weekly_setup_enabled: boolean;
  weekly_setup_day: number;
  morning_today_enabled: boolean;
  closeout_enabled: boolean;
  inactivity_enabled: boolean;
};

type ProfileRow = {
  id: string;
  family_id: string;
  display_name: string;
  email: string | null;
  last_seen_at: string | null;
};

type ReminderCandidate = {
  type: "weekly_setup" | "morning_today" | "closeout" | "inactivity";
  subject: string;
  heading: string;
  body: string;
  deepLink: string;
};

function localParts(now: Date, timezone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
    hour: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const value = (type: "year" | "month" | "day" | "weekday" | "hour") => parts.find((part) => part.type === type)?.value ?? "";
  const weekday = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(value("weekday"));
  return {
    dateKey: `${value("year")}-${value("month")}-${value("day")}`,
    weekday,
    hour: Number(value("hour")),
  };
}

function candidatesFor(preference: PreferenceRow, profile: ProfileRow, now: Date): ReminderCandidate[] {
  let local;
  try {
    local = localParts(now, preference.timezone || "America/Chicago");
  } catch {
    local = localParts(now, "America/Chicago");
  }

  const candidates: ReminderCandidate[] = [];
  if (preference.weekly_setup_enabled && local.weekday === preference.weekly_setup_day && local.hour === 16) {
    candidates.push({
      type: "weekly_setup",
      subject: "Your next SoftWeek is ready to set up",
      heading: "Your next week is ready to set up.",
      body: "Open the week, bring in your normal rhythm, and carry forward only what still matters.",
      deepLink: "/dashboard/planner?view=week&reminder=weekly_setup",
    });
  }
  if (preference.morning_today_enabled && local.hour === 7) {
    candidates.push({
      type: "morning_today",
      subject: "Today’s SoftWeek plan",
      heading: "Today’s plan is waiting when you need it.",
      body: "See today’s work, anything unfinished from earlier, and the quickest way to adjust the day.",
      deepLink: "/dashboard/planner?view=today&reminder=morning_today",
    });
  }
  if (preference.closeout_enabled && local.weekday === 5 && local.hour === 16) {
    candidates.push({
      type: "closeout",
      subject: "Wrap up your SoftWeek",
      heading: "Unfinished work can be carried forward in one step.",
      body: "Review what happened, keep the record, and start next week without rebuilding it.",
      deepLink: "/dashboard/planner?view=week&closeout=1&reminder=closeout",
    });
  }
  if (preference.inactivity_enabled && local.hour === 16 && local.weekday === preference.weekly_setup_day) {
    const lastSeen = profile.last_seen_at ? new Date(profile.last_seen_at).getTime() : 0;
    if (!lastSeen || now.getTime() - lastSeen >= 7 * 24 * 60 * 60 * 1000) {
      candidates.push({
        type: "inactivity",
        subject: "Your SoftWeek is still here",
        heading: "Pick the week back up wherever you left it.",
        body: "Nothing needs to be rebuilt. Open Today or move unfinished work forward when you are ready.",
        deepLink: "/dashboard/planner?view=today&reminder=inactivity",
      });
    }
  }
  return candidates;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function emailHtml(name: string, reminder: ReminderCandidate, url: string) {
  const safeName = escapeHtml(name.trim()) || "there";
  const safeUrl = escapeHtml(url);
  return `<!doctype html><html><body style="margin:0;background:#f7f1e5;color:#28332c;font-family:Arial,sans-serif"><div style="max-width:560px;margin:0 auto;padding:36px 22px"><p style="font-size:14px">Hi ${safeName},</p><h1 style="font-size:26px;line-height:1.2;margin:20px 0 10px">${escapeHtml(reminder.heading)}</h1><p style="font-size:16px;line-height:1.6">${escapeHtml(reminder.body)}</p><p style="margin:28px 0"><a href="${safeUrl}" style="background:#2f4a3c;color:white;text-decoration:none;padding:12px 18px;border-radius:8px;display:inline-block">Open SoftWeek</a></p><p style="font-size:12px;color:#68736c">You chose this reminder in SoftWeek. Change it any time under Account.</p></div></body></html>`;
}

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const resendKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.SOFTWEEK_FROM_EMAIL;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://softweekplanner.com";

  if (!cronSecret || request.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let siteBase: URL;
  try {
    siteBase = new URL(siteUrl);
  } catch {
    return NextResponse.json({ error: "NEXT_PUBLIC_SITE_URL must be an absolute URL." }, { status: 500 });
  }

  if (!supabaseUrl || !serviceRoleKey || !resendKey || !fromEmail) {
    return NextResponse.json({ ok: true, skipped: true, reason: "Reminder environment variables are not fully configured." });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });
  const { data: preferences, error: preferenceError } = await supabase
    .from("notification_preferences")
    .select("*")
    .eq("email_enabled", true);
  if (preferenceError) return NextResponse.json({ error: preferenceError.message }, { status: 500 });
  const preferenceRows = (preferences ?? []) as PreferenceRow[];
  if (!preferenceRows.length) return NextResponse.json({ ok: true, sent: 0, skipped: 0 });

  const familyIds = preferenceRows.map((row) => row.family_id);
  const { data: profiles, error: profileError } = await supabase
    .from("profiles")
    .select("id,family_id,display_name,email,last_seen_at")
    .in("family_id", familyIds)
    .eq("role", "parent")
    .not("email", "is", null);
  if (profileError) return NextResponse.json({ error: profileError.message }, { status: 500 });

  const profileRows = (profiles ?? []) as ProfileRow[];
  const profileByFamily = new Map<string, ProfileRow>(
    profileRows.map((row): [string, ProfileRow] => [row.family_id, row])
  );
  const now = new Date();
  let sent = 0;
  let skipped = 0;
  const failures: string[] = [];

  for (const preference of preferenceRows) {
    const profile = profileByFamily.get(preference.family_id);
    if (!profile?.email) { skipped += 1; continue; }
    let localDateKey = now.toISOString().slice(0, 10);
    try { localDateKey = localParts(now, preference.timezone).dateKey; } catch { /* use UTC key */ }

    for (const reminder of candidatesFor(preference, profile, now)) {
      const deliveryKey = `${reminder.type}:${localDateKey}`;
      const deepLink = new URL(reminder.deepLink, siteBase).toString();
      let { data: delivery, error: deliveryError } = await supabase
        .from("reminder_deliveries")
        .insert({
          family_id: preference.family_id,
          reminder_type: reminder.type,
          delivery_key: deliveryKey,
          recipient_email: profile.email,
          status: "pending",
          deep_link: deepLink,
        })
        .select("id,status")
        .single();

      if (deliveryError?.code === "23505") {
        const { data: existing, error: existingError } = await supabase
          .from("reminder_deliveries")
          .select("id,status")
          .eq("family_id", preference.family_id)
          .eq("delivery_key", deliveryKey)
          .maybeSingle();
        if (existingError || !existing) {
          failures.push(existingError?.message ?? "Could not read the existing reminder delivery.");
          continue;
        }
        if (existing.status !== "failed") {
          skipped += 1;
          continue;
        }
        const retry = await supabase
          .from("reminder_deliveries")
          .update({ status: "pending", error_message: null, recipient_email: profile.email, deep_link: deepLink })
          .eq("id", existing.id)
          .select("id,status")
          .single();
        delivery = retry.data;
        deliveryError = retry.error;
      }
      if (deliveryError || !delivery) { failures.push(deliveryError?.message ?? "Could not create delivery record"); continue; }

      try {
        const response = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            from: fromEmail,
            to: [profile.email],
            subject: reminder.subject,
            html: emailHtml(profile.display_name, reminder, deepLink),
          }),
        });
        const payload = await response.json().catch(() => ({})) as { id?: string; message?: string };
        if (!response.ok) throw new Error(payload.message || `Resend returned ${response.status}`);

        await supabase.from("reminder_deliveries").update({ status: "sent", provider_id: payload.id ?? null, sent_at: new Date().toISOString() }).eq("id", delivery.id);
        await supabase.from("app_events").insert({
          family_id: preference.family_id,
          user_id: profile.id,
          event_name: "reminder_sent",
          event_source: reminder.type,
          event_key: `reminder_sent:${preference.family_id}:${deliveryKey}`,
          metadata: { reminderType: reminder.type },
        });
        sent += 1;
      } catch (error) {
        const message = error instanceof Error ? error.message : "Reminder could not be sent";
        failures.push(message);
        await supabase.from("reminder_deliveries").update({ status: "failed", error_message: message }).eq("id", delivery.id);
      }
    }
  }

  return NextResponse.json({ ok: failures.length === 0, sent, skipped, failures: failures.slice(0, 10) });
}
