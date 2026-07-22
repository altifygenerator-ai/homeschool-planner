"use client";

import { useEffect, useMemo, useState } from "react";
import { LuBell, LuCheck, LuClock3, LuMail } from "react-icons/lu";
import {
  defaultNotificationPreferences,
  readNotificationPreferences,
  saveNotificationPreferences,
} from "@/lib/notificationPreferences";
import { trackSoftWeekEvent } from "@/lib/usageTracking";
import type { NotificationPreferences } from "@/types/planner";

const weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function InAppReminder({ preferences }: { preferences: NotificationPreferences }) {
  const prompt = useMemo(() => {
    const day = new Date().getDay();
    if (preferences.weeklySetupEnabled && day === preferences.weeklySetupDay) {
      return { title: "Your next week is ready to set up.", href: "/dashboard/planner?view=week", action: "Open the week" };
    }
    if (preferences.closeoutEnabled && (day === 5 || day === 6)) {
      return { title: "Unfinished work can be carried forward in one step.", href: "/dashboard/planner?view=week&closeout=1", action: "Review the week" };
    }
    return { title: "Today’s plan is waiting when you need it.", href: "/dashboard/planner?view=today", action: "Open Today" };
  }, [preferences.closeoutEnabled, preferences.weeklySetupDay, preferences.weeklySetupEnabled]);

  return (
    <div className="sw-in-app-reminder">
      <LuBell aria-hidden="true" />
      <div><strong>{prompt.title}</strong><span>In-app reminders stay available even when email is off.</span></div>
      <a href={prompt.href}>{prompt.action}</a>
    </div>
  );
}

export default function ReminderPreferences() {
  const [preferences, setPreferences] = useState(defaultNotificationPreferences);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let mounted = true;
    readNotificationPreferences()
      .then((next) => { if (mounted) setPreferences(next); })
      .catch((error: unknown) => { if (mounted) setMessage(error instanceof Error ? error.message : "Reminder settings could not be loaded."); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  function update<K extends keyof NotificationPreferences>(key: K, value: NotificationPreferences[K]) {
    setPreferences((current) => ({ ...current, [key]: value }));
    setMessage("");
  }

  async function save() {
    setSaving(true);
    setMessage("");
    try {
      await saveNotificationPreferences(preferences);
      setMessage("Reminder preferences saved.");
      void trackSoftWeekEvent("reminder_preferences_updated", { source: "account" });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Reminder settings could not be saved.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <section className="sw-reminder-settings" aria-busy="true">Loading reminder preferences…</section>;

  return (
    <section className="sw-reminder-settings" aria-labelledby="reminder-heading">
      <div className="sw-reminder-heading">
        <div><LuClock3 aria-hidden="true" /><span>Optional reminders</span></div>
        <h2 id="reminder-heading">A quiet nudge, not another source of pressure.</h2>
        <p>Choose only the reminders that help. SoftWeek never uses streak warnings or “falling behind” language.</p>
      </div>

      <InAppReminder preferences={preferences} />

      <div className="sw-preference-grid">
        <label className="sw-toggle-row">
          <input type="checkbox" checked={preferences.emailEnabled} onChange={(event) => update("emailEnabled", event.target.checked)} />
          <span><LuMail aria-hidden="true" /><strong>Email reminders</strong><small>Use the parent account email.</small></span>
        </label>
        <label className="sw-toggle-row">
          <input type="checkbox" checked={preferences.weeklySetupEnabled} onChange={(event) => update("weeklySetupEnabled", event.target.checked)} />
          <span><strong>Weekly setup</strong><small>Your next week is ready to set up.</small></span>
        </label>
        <label className="sw-toggle-row">
          <input type="checkbox" checked={preferences.morningTodayEnabled} onChange={(event) => update("morningTodayEnabled", event.target.checked)} />
          <span><strong>Morning Today</strong><small>Today’s plan is waiting when you need it.</small></span>
        </label>
        <label className="sw-toggle-row">
          <input type="checkbox" checked={preferences.closeoutEnabled} onChange={(event) => update("closeoutEnabled", event.target.checked)} />
          <span><strong>End-of-week review</strong><small>Carry unfinished work forward in one step.</small></span>
        </label>
        <label className="sw-toggle-row">
          <input type="checkbox" checked={preferences.inactivityEnabled} onChange={(event) => update("inactivityEnabled", event.target.checked)} />
          <span><strong>Gentle return reminder</strong><small>Sent after a full week away, at most once per week.</small></span>
        </label>
      </div>

      <div className="sw-reminder-fields">
        <label>Setup day<select value={preferences.weeklySetupDay} onChange={(event) => update("weeklySetupDay", Number(event.target.value))}>{weekdays.map((day, index) => <option value={index} key={day}>{day}</option>)}</select></label>
        <label>Time zone<input value={preferences.timezone} onChange={(event) => update("timezone", event.target.value)} placeholder="America/Chicago" /></label>
      </div>

      <div className="sw-reminder-save">
        <button className="btn btn-primary" type="button" onClick={save} disabled={saving}>{saving ? "Saving…" : "Save reminders"}</button>
        {message ? <p role="status"><LuCheck aria-hidden="true" />{message}</p> : null}
      </div>
    </section>
  );
}
