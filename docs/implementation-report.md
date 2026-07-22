# SoftWeek retention redesign final report

## What changed

SoftWeek now centers the signed-in experience on **Today**, **Week**, **Records**, **Family**, and a global **Add** action. New users can create a useful planner item without creating a child first. Returning users and the installed PWA open directly to Today.

The planner now supports a nullable weekday through a real **This Week** holding area, title-first quick entry, pasted-list entry, direct Today entry, carried earlier work, granular item mutations, visible synchronization states, optimistic rollback, IndexedDB offline queuing, and automatic weekly record updates.

The principal retention loops are implemented:

- **Life Happened** bulk recovery with a plain preview, transactional application, and Undo.
- **Weekly Rhythms** with weekday/child/time/start/end controls and duplicate-safe generation.
- **Lesson Stacks** with pasted ordered lessons and next 1/3/5 item placement.
- **Week closeout** with an optional family note, unfinished-work decisions, carry-forward, and next-week setup.
- Optional weekly setup, morning Today, closeout, and inactivity reminders with timezone preferences, idempotent deliveries, Resend, Vercel Cron, and in-app fallback messaging.
- Meaningful acquisition, activation, feature-adoption, reminder, and weekly-return events plus retention SQL queries.

The application and public site use one notebook-informed visual system. The old layered planner navigation, rigid phone calendar, repeated card styling, backup files, obsolete planner implementations, unused homepage components, and empty demo files were removed.

## Files changed

### Product and interface

- `src/components/planner/PlannerShell.tsx`
- `src/components/planner/redesign/QuickAdd.tsx`
- `src/components/planner/redesign/PlannerItemRow.tsx`
- `src/components/planner/redesign/TodayScreen.tsx`
- `src/components/planner/redesign/WeekScreen.tsx`
- `src/components/planner/redesign/LifeHappenedDialog.tsx`
- `src/components/planner/redesign/WeeklyRhythmEditor.tsx`
- `src/components/planner/redesign/LessonStackManager.tsx`
- `src/components/planner/redesign/WeekCloseout.tsx`
- `src/components/planner/SavedWeeksView.tsx`
- `src/components/dashboard/DashboardShell.tsx`
- `src/components/dashboard/ChildrenOverview.tsx`
- `src/components/dashboard/AccountOverview.tsx`
- `src/components/dashboard/ReminderPreferences.tsx`
- `src/components/dashboard/ChildPortfolioDetail.tsx`
- `src/components/auth/AuthGate.tsx`
- `src/components/auth/AccountBar.tsx`
- `src/components/layout/Header.tsx`
- `src/components/print/PrintRecordView.tsx`
- `src/components/pwa/MobileDashboardNav.tsx`
- `src/components/pwa/ServiceWorkerRegister.tsx`
- `src/components/shared/BetaFeedbackWidget.tsx`
- `src/app/dashboard/page.tsx`
- `src/app/dashboard/weeks/page.tsx`
- `src/app/page.tsx`
- `src/app/layout.tsx`
- `src/app/globals.css`

### Data, auth, analytics, offline, and reminders

- `src/types/planner.ts`
- `src/lib/plannerLogic.ts`
- `src/lib/plannerRepository.ts`
- `src/lib/plannerStorage.ts`
- `src/lib/offlineQueue.ts`
- `src/lib/notificationPreferences.ts`
- `src/lib/localAuth.ts`
- `src/lib/usageTracking.ts`
- `src/app/api/cron/reminders/route.ts`
- `supabase/beta-2-0-retention-redesign.sql`
- `vercel.json`
- `.env.local.example`

### PWA, tests, and documentation

- `public/sw.js`
- `public/pwa-screenshot-wide.png`
- `public/pwa-screenshot-mobile.png`
- `src/app/manifest.ts`
- `tests/plannerLogic.test.ts`
- `package.json`
- `tsconfig.json`
- `README.md`
- `docs/softweek-retention-redesign.md`
- `docs/retention-analytics.sql`
- `docs/implementation-report.md`
- `docs/beta-1-1-supabase-setup.md` (stored project credentials replaced with placeholders)

Obsolete planner components, old homepage components, empty demo files, and `.bak` files were removed. A full file-level comparison against the supplied ZIP is represented by these categories.

## Database changes

Run `supabase/beta-2-0-retention-redesign.sql` after the existing Beta 1.x migrations. It is additive and preserves existing IDs and rows.

Key changes:

- `planner_items.day_of_week` becomes nullable.
- `placement`, ordering, completion date/time, actual date, time spent, and source-reference columns are added.
- Existing rows are backfilled as day-placed without changing their IDs.
- New normalized tables support Weekly Rhythms, Lesson Stacks, planner-item events, notification preferences, and reminder deliveries.
- Foreign keys, indexes, updated-at triggers, placement checks, nonnegative time checks, and idempotency constraints are included.
- A parent-guarded transactional bulk-move RPC supports Life Happened and other multi-item moves.
- RLS remains family-scoped. Child profiles are limited to self/parent/admin access. Checklist child accounts remain progress-only; Flexible and Independent accounts may reschedule only plans visible under existing assigned/everyone policies.
- Retention aggregate views are included.

## Required environment variables

Browser/public:

```env
NEXT_PUBLIC_SITE_URL=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

Server-only reminder infrastructure:

```env
SUPABASE_SERVICE_ROLE_KEY=
RESEND_API_KEY=
SOFTWEEK_FROM_EMAIL=
CRON_SECRET=
```

Email reminders fail closed and return a safe skipped response when server email variables are not configured.

## Commands run and results

### Passed

```text
npm test
```

Result: **10 tests passed, 0 failed**. Coverage includes local-date week calculations, month/year boundaries, selected-day recovery, spread recovery, carry-forward, completed/skipped recovery exclusions, deterministic duplicate-safe rhythm IDs, and ordered lesson-stack selection.

A TypeScript parser/transpile validation was run over all current `.ts` and `.tsx` source/test files.

Result: **64 TypeScript files checked, 0 syntax failures**.

A local import-resolution scan was run for relative imports and `@/` aliases.

Result: **0 missing local imports**.

A permissive strict TypeScript semantic pass was also run with external framework modules stubbed because the package registry could not materialize Next.js dependencies. It checked internal prop contracts, unions, nullability, and unused locals/parameters.

Result: **0 internal semantic type errors and 0 unused local/parameter errors**.

A JSX/CSS integrity scan checked nested interactive controls, static class coverage, and stylesheet structure.

Result: **0 nested link/button violations, 0 missing static class rules, and balanced CSS braces**.

The Supabase migration received a structural sanity pass.

Result: **balanced function bodies, unique trigger names, unique policy names, the legacy Lesson Stack trigger is dropped before replacement, and family-level retention views are denied to normal authenticated accounts**.

Responsive layout rules and the finished application preview assets were checked against 320, 360, 390, 430, 768, 1024, and 1366 pixel targets.

Result: phone layouts use vertical day sections, safe-area bottom navigation, full-width filters, non-drag move controls, and explicit bottom content clearance. The actual Next.js application could not be launched in this environment after the registry failure, so this is a source/layout audit rather than a claim of a final live-browser run.

### Blocked by package registry availability

Multiple `npm ci` attempts were made through the configured package gateway and directly through the public registry. The configured gateway returned repeated HTTP 503 errors for package tarballs; the direct registry attempt failed DNS resolution with `EAI_AGAIN`. Because dependencies could not be fully materialized in this environment:

```text
npm run lint  -> eslint: not found
npm run build -> next: not found
```

These are dependency-installation failures, not reported lint or Next.js compilation results. Run `npm ci`, `npm run lint`, and `npm run build` in a normal networked environment before deployment.

## Routes reviewed

Source and route integration were reviewed for:

- `/`
- `/login`
- `/guest`
- `/dashboard` (redirects to Today)
- `/dashboard/planner?view=today`
- `/dashboard/planner?view=week`
- `/dashboard/weeks`
- `/dashboard/children`
- `/dashboard/account`
- existing weekly/monthly/yearly print routes
- `/api/cron/reminders`
- `/offline.html`

The application itself could not be launched for live route testing because Next.js dependencies could not be installed in the supplied execution environment.

## Responsive widths checked

- 320 px
- 360 px
- 390 px
- 430 px
- 768 px
- 1024 px
- 1366 px laptop/desktop preview

## Remaining limitations

- A real Supabase project is required to execute the migration and verify production RLS against parent, child, admin, and service-role sessions.
- Reminder email delivery requires a verified Resend sending domain and Vercel environment configuration.
- Offline mutation replay currently uses a predictable last-write model for simple item edits. It does not present a manual conflict-resolution interface for simultaneous edits on multiple devices.
- Independent child accounts can read approved Lesson Stacks and reschedule permitted work, but parent review of child-created suggested items remains intentionally conservative rather than adding a second approval inbox in this release.
- Full ESLint, the real Next.js production build, and live browser route execution still need to run after dependencies install successfully. The hydration-sensitive source path was corrected and statically audited, but this environment could not launch Next.js for a final runtime hydration assertion.

## Full correction audit after the hydration report

The reported hydration mismatch was not treated as a one-line dialog issue. The full source package was reopened and audited again.

### Hydration and stale-client correction

- The feedback trigger now has the same closed structure on the server and on the client’s first render.
- The feedback dialog is mounted through a portal only after hydration and only while open.
- Backdrop click, the close button, Escape, focus trapping, focus restoration, and body scroll restoration are implemented.
- Development and localhost service workers are removed instead of registered.
- An early one-time service-worker migration clears older `softweek-*` caches and unregisters an already controlling legacy worker before React hydrates, then reloads once and allows the corrected worker to register.
- The current worker uses a new cache version, never caches rendered HTML, keeps private navigation network-only, and deletes only SoftWeek-owned caches.

### Visual and responsive correction

- The homepage no longer renders a fake oversized planner composition. It uses the finished wide and mobile application screenshots with explicit intrinsic dimensions and controlled responsive widths.
- The preview is capped so it supports the hero rather than dominating it.
- Homepage navigation targets now point to real section IDs.
- Duplicate application navigation was removed. Desktop has one focused application header; phones use one safe-area-aware bottom navigation.
- Parent and child navigation differ intentionally. Parent-only Records, Family, and Add actions are not shown to child accounts.
- Supporting account, record, child, print, reminder, error, loading, and retry states have deliberate styles instead of relying on undefined classes.

### Workflow and failure correction

- Quick entry keeps user text when persistence fails.
- Delete Undo restores the actual repository result and reports queued/offline state correctly.
- Life Happened Undo restores each item’s original status instead of forcing everything back to Planned, and failed Undo operations remain visible and retryable.
- Copy-last-week, rhythm generation, Lesson Stack placement, and closeout carry-forward use deterministic IDs and partial-failure reporting so retries do not create duplicates.
- Automatic and closeout records exclude transient client synchronization state.
- Print and child-record pages now show explicit loading and error states rather than flashing “not found” or loading forever after a rejected request.
- Auth shell/account lookups and the PWA install prompt catch rejected browser or account operations instead of leaving unhandled promises.

### Security correction

- Child account navigation and account summaries no longer query or expose parent-only family account and saved-record data.
- Saved-week snapshot selection is parent/admin-only because snapshots may contain sibling work.
- Checklist children remain progress-only; Flexible and Independent children can reschedule only visible assigned/everyone work.
- Lesson Stack progress synchronization runs through guarded trigger execution.
- Trigger functions cannot be called directly by normal authenticated users.
- Retention aggregate views are service-role-only.
