-- SoftWeek Beta 1.3 week templates
-- Run this after Beta 1.1 / Beta 1.2 if your project is already live.

create table if not exists public.week_templates (
  id text primary key,
  family_id uuid not null references public.families(id) on delete cascade,
  name text not null,
  plans jsonb not null default '[]'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists week_templates_family_idx on public.week_templates(family_id);

alter table public.week_templates enable row level security;

drop policy if exists "week templates read family" on public.week_templates;
drop policy if exists "week templates parent insert" on public.week_templates;
drop policy if exists "week templates parent update" on public.week_templates;
drop policy if exists "week templates parent delete" on public.week_templates;

create policy "week templates read family" on public.week_templates
for select to authenticated
using (public.softweek_is_member_of_family(family_id));

create policy "week templates parent insert" on public.week_templates
for insert to authenticated
with check (public.softweek_is_parent_for_family(family_id));

create policy "week templates parent update" on public.week_templates
for update to authenticated
using (public.softweek_is_parent_for_family(family_id))
with check (public.softweek_is_parent_for_family(family_id));

create policy "week templates parent delete" on public.week_templates
for delete to authenticated
using (public.softweek_is_parent_for_family(family_id));

drop trigger if exists touch_week_templates_updated_at on public.week_templates;
create trigger touch_week_templates_updated_at
before update on public.week_templates
for each row execute function public.touch_updated_at();
