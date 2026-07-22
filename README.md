# SoftWeek Planner

SoftWeek is a flexible weekly homeschool planner built around one practical loop: capture what matters, place it loosely into the week, work from Today, recover quickly when plans change, and let completed work become the record automatically.

The product is intentionally not a gradebook, curriculum marketplace, school-management suite, or generic project-management dashboard.

## Product areas

- **Today**: quick entry, today’s work, earlier unfinished work, completion notes, resources, and simple rescheduling.
- **Week**: a real **This Week** holding area plus Monday–Sunday sections, list pasting, copy-last-week, Weekly Rhythms, Lesson Stacks, Life Happened recovery, and closeout.
- **Records**: automatic weekly snapshots, search and filters, child summaries, resources, actual completion dates, and weekly/monthly/yearly print routes.
- **Family**: child profiles, optional child accounts, and Checklist/Flexible/Independent permission levels.
- **Reminders**: optional setup, Today, closeout, and inactivity emails with an in-app equivalent and idempotent deliveries.

## Stack

- Next.js 16 App Router
- React 19 and TypeScript strict mode
- Supabase Auth, Postgres, and RLS
- Resend for optional reminder email
- Vercel Cron for scheduled reminder checks
- Service worker for static assets and an offline fallback
- IndexedDB mutation queue for authenticated planner-item changes made offline

## Local setup

1. Install dependencies:

```bash
npm ci
```

2. Copy the environment template:

```bash
cp .env.local.example .env.local
```

3. Add the required browser variables:

```env
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

4. Apply migrations in this order:

```text
supabase/beta-1-1-schema.sql
supabase/beta-1-2-resource-links.sql
supabase/beta-1-3-week-templates.sql
supabase/beta-1-4-usage-tracking.sql
supabase/beta-1-5-child-invite-fix.sql
supabase/beta-1-7-planner-redesign-child-guard.sql
supabase/beta-2-0-retention-redesign.sql
```

5. Start development:

```bash
npm run dev
```

## Commands

```bash
npm run dev       # local App Router development server
npm run test      # deterministic planner-logic tests
npm run lint      # ESLint
npm run build     # production build and TypeScript validation
npm run start     # serve the production build
```

## Reminder setup

Email reminders are optional. The account screen still shows a quiet in-app reminder when email is disabled.

Server-only variables:

```env
SUPABASE_SERVICE_ROLE_KEY=...
RESEND_API_KEY=...
SOFTWEEK_FROM_EMAIL="SoftWeek <reminders@your-domain.com>"
CRON_SECRET=...
```

`vercel.json` calls `/api/cron/reminders` hourly. The route:

- requires `Authorization: Bearer $CRON_SECRET`;
- evaluates each family in its selected IANA time zone;
- creates a unique delivery record before sending;
- skips duplicate deliveries safely;
- records successful sends as `reminder_sent` events;
- returns a safe skipped response when email variables are absent.

Do not place `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, or `CRON_SECRET` in any `NEXT_PUBLIC_` variable.

## PWA and offline behavior

The installed application opens at `/dashboard/planner?view=today`. The service worker caches only static files and the offline fallback. It deliberately does **not** cache authenticated dashboard HTML.

Development and localhost do not register a service worker. The root layout also performs a one-time migration away from older SoftWeek workers and cache versions before hydration, preventing stale JavaScript from being paired with newer server-rendered HTML after this update.

Planner-item create, update, move, complete, skip, and delete operations made while offline are queued in IndexedDB. The UI displays `Offline`, and queued changes replay after reconnection. An item is not represented as server-saved until replay succeeds.

## Database compatibility and security

The Beta 2.0 migration is additive and backward-compatible:

- existing weekday plans remain day-placed;
- `day_of_week` becomes nullable for This Week items;
- existing IDs, children, categories, templates, invites, plans, and saved records are retained;
- normal item edits use granular mutations instead of deleting and rewriting a full week;
- multi-item recovery uses a guarded transactional RPC;
- RLS remains family-scoped, and child accounts can read only assigned/everyone work and their own child profile.

Review `docs/softweek-retention-redesign.md` before deployment and `docs/retention-analytics.sql` for product-retention queries.

## Deployment checklist

1. Run all Supabase migrations in order.
2. Configure browser and server-only environment variables in Vercel.
3. Set the production Site URL and auth redirect URLs in Supabase.
4. Confirm the Vercel Cron route receives the expected authorization header.
5. Run `npm run test`, `npm run lint`, and `npm run build`.
6. Test parent, child, guest, and admin access against production RLS.
7. Install the PWA on a phone and verify Today, Week, Add, Records, Family, offline status, and reconnection replay.
