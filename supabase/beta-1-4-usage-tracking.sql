-- SoftWeek Beta 1.4 usage tracking
-- Run this after the Beta 1.1 schema. This stores lightweight app activity
-- so returning users and real feature usage can be reviewed without tracking lesson details.

alter table public.profiles
  add column if not exists last_seen_at timestamptz,
  add column if not exists last_active_feature text,
  add column if not exists login_count integer not null default 0;

create table if not exists public.app_events (
  id uuid primary key default gen_random_uuid(),
  family_id uuid references public.families(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  child_id text references public.children(id) on delete set null,
  event_name text not null,
  event_source text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists app_events_family_created_idx
  on public.app_events(family_id, created_at desc);

create index if not exists app_events_user_created_idx
  on public.app_events(user_id, created_at desc);

create index if not exists app_events_name_created_idx
  on public.app_events(event_name, created_at desc);

alter table public.app_events enable row level security;

drop policy if exists "app events insert own" on public.app_events;
drop policy if exists "app events view family" on public.app_events;
drop policy if exists "app events admin view all" on public.app_events;

create policy "app events insert own" on public.app_events
for insert to authenticated
with check (
  user_id = auth.uid()
  and public.softweek_is_member_of_family(family_id)
);

create policy "app events view family" on public.app_events
for select to authenticated
using (public.softweek_is_member_of_family(family_id));

create policy "app events admin view all" on public.app_events
for select to authenticated
using (public.softweek_is_admin());
