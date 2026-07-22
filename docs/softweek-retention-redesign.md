# SoftWeek retention redesign implementation

## Purpose

This release reorganizes SoftWeek around weekly return behavior rather than feature quantity. The application now helps a family create the first useful item quickly, keep undecided work in **This Week**, act from **Today**, recover from disrupted days in bulk, preserve the record through normal use, and begin the following week without rebuilding it.

## Information architecture

The signed-in application uses four primary destinations and one global action:

1. Today
2. Week
3. Records
4. Family
5. Add

Desktop uses a compact application header. Mobile uses a safe-area-aware fixed bottom navigation. Returning users and the installed PWA enter Today directly.

## Main workflows

### First use

The empty planner leads with a title-first quick-entry field. A child, category, day, and other metadata are optional. A new item can be left in This Week, placed on a day, or turned into a Weekly Rhythm.

### Today

Today displays the actual date, one-tap child filtering, direct quick add, scheduled work, unfinished earlier work, resource links, completion, skip/restore, rescheduling, and optional completion notes. Completed work is collapsed by default.

### Week

The Week screen uses a vertical, readable layout at phone widths and does not compress seven columns onto a phone. It includes:

- This Week holding area
- Monday through Sunday sections
- quick add and deterministic pasted-list entry
- copy last week
- Weekly Rhythms
- Lesson Stacks
- Life Happened
- week closeout and next-week setup

### Life Happened

Life Happened previews the affected work before applying one of four bulk recovery choices:

- tomorrow
- spread over remaining days
- return to This Week
- move to next week

Completed and skipped work are left unchanged. Applied changes support Undo and are written through the transactional bulk-move RPC when the migration is installed.

### Weekly Rhythms

A parent can make an item part of the normal week by choosing weekdays, child/everyone, time block, start week, optional end week, and active state. Generated planner rows include a source rhythm ID. The `(rhythm, week, day)` identity is checked before generation so refreshing a week does not create duplicates.

Existing week templates remain available through the legacy storage layer. Weekly Rhythms are the clearer recurring model rather than a destructive template replacement.

### Lesson Stacks

Lesson Stacks are ordered queues. A parent can paste lesson titles and add the next one, three, or five items into This Week. They remain secondary to normal weekly planning and do not introduce course or gradebook setup during onboarding.

### Closeout and records

Planner changes automatically refresh the stable weekly record snapshot. The closeout flow summarizes the week, stores an optional family note, carries selected unfinished work into the following week’s holding area, and opens that week. The user never has to understand or manually create a database snapshot.

Records support title/note search and child, category, and date filtering while preserving weekly, monthly, and yearly printing.

## Persistence

`src/lib/plannerRepository.ts` is the primary planner mutation layer. It provides granular create, update, move, complete, skip, restore, soft-delete, reorder, and bulk-move operations. The old `savePlansForWeek` entry point remains for backward compatibility, but it now diffs IDs and soft-deletes only removed rows instead of clearing every row on every change.

Optimistic changes show Saving, Saved, Offline, or Could not save. Failed online mutations roll back the affected item and retain the rest of the week.

Authenticated planner mutations made offline are queued in IndexedDB by `src/lib/offlineQueue.ts`. Cached planner data can be read while disconnected, queued mutations are marked accordingly, and replay occurs after the browser reconnects.

## Database migration

Run `supabase/beta-2-0-retention-redesign.sql` after all Beta 1.x migrations. It:

- permits nullable `day_of_week` with explicit `placement` validation;
- adds ordering, completion, actual-date/time, and source columns;
- creates Weekly Rhythm, Lesson Stack, planner-event, notification-preference, and delivery tables;
- adds child permission levels;
- adds indexes, triggers, foreign keys, and idempotency constraints;
- preserves existing planner rows and IDs;
- installs parent/child RLS policies;
- adds a parent-guarded transactional bulk move RPC;
- updates the child guard so Checklist accounts are progress-only while Flexible and Independent accounts can reschedule permitted work;
- adds retention aggregate views.

## Child permissions

- **Checklist**: see assigned/everyone work, open resources, mark done, skip, and add a completion note.
- **Flexible**: Checklist plus approved movement between days and This Week.
- **Independent**: Flexible plus read access to parent-approved Lesson Stacks.

Parent-only tools, billing, sibling-only planner work, and unrelated child profiles remain unavailable.

## Analytics

Tracking now uses a stable anonymous browser session ID, acquisition source/campaign, and unique milestone keys. Milestones are not repeatedly emitted. The major events include first/third item, first schedule/completion, Today/Week use, This Week entry, recovery, rhythm, stack, closeout, next-week creation, reminder send/click, feedback, and PWA installation.

Use `docs/retention-analytics.sql` for the core funnel and return queries.

## Reminders

`/api/cron/reminders` is a server-only hourly check. It evaluates local day/hour from each family’s IANA time zone, creates an idempotent delivery row, sends through Resend, and records the result. It degrades safely when email configuration is missing.

Required server variables:

- `SUPABASE_SERVICE_ROLE_KEY`
- `RESEND_API_KEY`
- `SOFTWEEK_FROM_EMAIL`
- `CRON_SECRET`

## PWA safety

The service worker never writes authenticated navigation responses to Cache Storage. Static assets use cache-first behavior; navigations use the network and fall back to a static offline page. The manifest does not force portrait orientation and uses real finished-product screenshot assets.

## Visual system

The redesign uses a notebook-informed application system: clear ruled divisions, restrained paper and ink tones, a dark moss application anchor, readable sans-serif task text, moderate radii, and borders instead of floating card grids. Statuses use text and shape in addition to color. Mobile actions target practical 44px touch sizing and bottom sheets/dialogs remain keyboard accessible.

## Key implementation files

- `src/components/planner/PlannerShell.tsx`
- `src/components/planner/redesign/*`
- `src/lib/plannerRepository.ts`
- `src/lib/plannerLogic.ts`
- `src/lib/offlineQueue.ts`
- `src/lib/usageTracking.ts`
- `src/components/dashboard/ReminderPreferences.tsx`
- `src/app/api/cron/reminders/route.ts`
- `src/app/globals.css`
- `src/app/page.tsx`
- `public/sw.js`
- `src/app/manifest.ts`
- `supabase/beta-2-0-retention-redesign.sql`
