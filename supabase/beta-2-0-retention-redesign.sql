-- SoftWeek Beta 2.0 retention redesign
-- Backward-compatible migration. Run after all Beta 1.x migrations.

create extension if not exists pgcrypto;

-- Flexible weekly placement and deterministic record fields.
alter table public.planner_items
  alter column day_of_week drop not null,
  add column if not exists placement text not null default 'day',
  add column if not exists order_index integer not null default 0,
  add column if not exists completed_at timestamptz,
  add column if not exists actual_date date,
  add column if not exists time_spent_minutes integer,
  add column if not exists source_rhythm_id text,
  add column if not exists source_lesson_stack_item_id text;

update public.planner_items
set placement = case when day_of_week is null then 'week' else 'day' end
where placement is null or placement not in ('week', 'day');

alter table public.planner_items drop constraint if exists planner_items_placement_check;
alter table public.planner_items drop constraint if exists planner_items_day_placement_check;
alter table public.planner_items drop constraint if exists planner_items_time_spent_check;
alter table public.planner_items
  add constraint planner_items_placement_check check (placement in ('week', 'day')),
  add constraint planner_items_day_placement_check check (
    (placement = 'week' and day_of_week is null)
    or (placement = 'day' and day_of_week is not null)
  ),
  add constraint planner_items_time_spent_check check (time_spent_minutes is null or time_spent_minutes >= 0);

create index if not exists planner_items_family_week_placement_idx
  on public.planner_items(family_id, week_start, placement, day_of_week, order_index)
  where deleted_at is null;
create index if not exists planner_items_completed_at_idx
  on public.planner_items(family_id, completed_at desc)
  where deleted_at is null;
create unique index if not exists planner_items_rhythm_week_day_unique
  on public.planner_items(family_id, source_rhythm_id, week_start, day_of_week)
  where source_rhythm_id is not null and deleted_at is null;

-- Child experience permissions.
alter table public.children
  add column if not exists permission_level text not null default 'checklist';
alter table public.children drop constraint if exists children_permission_level_check;
alter table public.children
  add constraint children_permission_level_check check (permission_level in ('checklist', 'flexible', 'independent'));

-- Reusable weekly rhythms.
create table if not exists public.weekly_rhythms (
  id text primary key,
  family_id uuid not null references public.families(id) on delete cascade,
  name text not null,
  title text not null,
  weekdays text[] not null default '{}',
  assigned_to_child_id text references public.children(id) on delete set null,
  category_slug text not null default 'other',
  time_block text not null default 'Anytime' check (time_block in ('Morning', 'Midday', 'Afternoon', 'Anytime')),
  notes text not null default '',
  resource_title text not null default '',
  resource_url text not null default '',
  start_week date not null,
  end_week date,
  active boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint weekly_rhythms_dates_check check (end_week is null or end_week >= start_week),
  constraint weekly_rhythms_weekdays_check check (weekdays <@ array['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday']::text[])
);
create index if not exists weekly_rhythms_family_active_idx on public.weekly_rhythms(family_id, active, start_week) where deleted_at is null;

-- Ordered lesson queues.
create table if not exists public.lesson_stacks (
  id text primary key,
  family_id uuid not null references public.families(id) on delete cascade,
  name text not null,
  assigned_to_child_id text references public.children(id) on delete set null,
  category_slug text not null default 'other',
  active boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index if not exists lesson_stacks_family_idx on public.lesson_stacks(family_id, active) where deleted_at is null;

create table if not exists public.lesson_stack_items (
  id text primary key,
  stack_id text not null references public.lesson_stacks(id) on delete cascade,
  family_id uuid not null references public.families(id) on delete cascade,
  title text not null,
  position integer not null default 0,
  status text not null default 'queued' check (status in ('queued', 'planned', 'done', 'skipped')),
  planner_item_id text references public.planner_items(id) on delete set null,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (stack_id, position)
);
create index if not exists lesson_stack_items_stack_position_idx on public.lesson_stack_items(stack_id, position) where deleted_at is null;

-- Audit trail for bulk recovery, carry-forward, completion, and undo.
create table if not exists public.planner_item_events (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  planner_item_id text references public.planner_items(id) on delete set null,
  event_name text not null,
  from_week_start date,
  to_week_start date,
  from_day text,
  to_day text,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists planner_item_events_family_created_idx on public.planner_item_events(family_id, created_at desc);
create index if not exists planner_item_events_item_created_idx on public.planner_item_events(planner_item_id, created_at desc);

-- Calm reminder preferences and idempotent deliveries.
create table if not exists public.notification_preferences (
  family_id uuid primary key references public.families(id) on delete cascade,
  timezone text not null default 'America/Chicago',
  email_enabled boolean not null default false,
  weekly_setup_enabled boolean not null default true,
  weekly_setup_day smallint not null default 0 check (weekly_setup_day between 0 and 6),
  morning_today_enabled boolean not null default false,
  closeout_enabled boolean not null default true,
  inactivity_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.reminder_deliveries (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  reminder_type text not null,
  delivery_key text not null,
  recipient_email text,
  status text not null default 'pending' check (status in ('pending', 'sent', 'skipped', 'failed')),
  deep_link text,
  provider_id text,
  error_message text,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  unique (family_id, delivery_key)
);
create index if not exists reminder_deliveries_created_idx on public.reminder_deliveries(created_at desc);

-- Analytics identity and milestone idempotency.
alter table public.app_events
  add column if not exists session_id text,
  add column if not exists event_key text;
create unique index if not exists app_events_event_key_unique
  on public.app_events(event_key)
  where event_key is not null;
create index if not exists app_events_session_created_idx on public.app_events(session_id, created_at desc);

-- Add source foreign keys after new tables exist. Existing rows remain valid because values default null.
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'planner_items_source_rhythm_fk') then
    alter table public.planner_items
      add constraint planner_items_source_rhythm_fk foreign key (source_rhythm_id) references public.weekly_rhythms(id) on delete set null;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'planner_items_source_lesson_fk') then
    alter table public.planner_items
      add constraint planner_items_source_lesson_fk foreign key (source_lesson_stack_item_id) references public.lesson_stack_items(id) on delete set null;
  end if;
end $$;

-- Updated-at triggers.
drop trigger if exists touch_weekly_rhythms_updated_at on public.weekly_rhythms;
create trigger touch_weekly_rhythms_updated_at before update on public.weekly_rhythms for each row execute function public.touch_updated_at();
drop trigger if exists touch_lesson_stacks_updated_at on public.lesson_stacks;
create trigger touch_lesson_stacks_updated_at before update on public.lesson_stacks for each row execute function public.touch_updated_at();
drop trigger if exists touch_lesson_stack_items_updated_at on public.lesson_stack_items;
create trigger touch_lesson_stack_items_updated_at before update on public.lesson_stack_items for each row execute function public.touch_updated_at();
drop trigger if exists touch_notification_preferences_updated_at on public.notification_preferences;
create trigger touch_notification_preferences_updated_at before update on public.notification_preferences for each row execute function public.touch_updated_at();

-- RLS remains explicit and family-scoped.
alter table public.weekly_rhythms enable row level security;
alter table public.lesson_stacks enable row level security;
alter table public.lesson_stack_items enable row level security;
alter table public.planner_item_events enable row level security;
alter table public.notification_preferences enable row level security;
alter table public.reminder_deliveries enable row level security;

drop policy if exists "rhythms parent read" on public.weekly_rhythms;
drop policy if exists "rhythms parent insert" on public.weekly_rhythms;
drop policy if exists "rhythms parent update" on public.weekly_rhythms;
drop policy if exists "rhythms parent delete" on public.weekly_rhythms;
create policy "rhythms parent read" on public.weekly_rhythms for select to authenticated using (public.softweek_is_parent_for_family(family_id));
create policy "rhythms parent insert" on public.weekly_rhythms for insert to authenticated with check (public.softweek_is_parent_for_family(family_id));
create policy "rhythms parent update" on public.weekly_rhythms for update to authenticated using (public.softweek_is_parent_for_family(family_id)) with check (public.softweek_is_parent_for_family(family_id));
create policy "rhythms parent delete" on public.weekly_rhythms for delete to authenticated using (public.softweek_is_parent_for_family(family_id));

drop policy if exists "lesson stacks parent all" on public.lesson_stacks;
drop policy if exists "lesson stacks independent read" on public.lesson_stacks;
create policy "lesson stacks parent all" on public.lesson_stacks for all to authenticated using (public.softweek_is_parent_for_family(family_id)) with check (public.softweek_is_parent_for_family(family_id));
create policy "lesson stacks independent read" on public.lesson_stacks for select to authenticated using (
  exists (
    select 1 from public.profiles p
    join public.children c on c.id = p.child_id and c.family_id = p.family_id
    where p.id = auth.uid() and p.role = 'child' and p.family_id = lesson_stacks.family_id
      and c.permission_level = 'independent'
      and (lesson_stacks.assigned_to_child_id is null or lesson_stacks.assigned_to_child_id = p.child_id)
  )
);

drop policy if exists "lesson items parent all" on public.lesson_stack_items;
drop policy if exists "lesson items independent read" on public.lesson_stack_items;
create policy "lesson items parent all" on public.lesson_stack_items for all to authenticated using (public.softweek_is_parent_for_family(family_id)) with check (public.softweek_is_parent_for_family(family_id));
create policy "lesson items independent read" on public.lesson_stack_items for select to authenticated using (
  exists (
    select 1 from public.profiles p
    join public.children c on c.id = p.child_id and c.family_id = p.family_id
    where p.id = auth.uid() and p.role = 'child' and p.family_id = lesson_stack_items.family_id
      and c.permission_level = 'independent'
  )
);

drop policy if exists "planner events family read" on public.planner_item_events;
drop policy if exists "planner events parent insert" on public.planner_item_events;
create policy "planner events family read" on public.planner_item_events for select to authenticated using (public.softweek_is_parent_for_family(family_id) or public.softweek_is_admin());
create policy "planner events parent insert" on public.planner_item_events for insert to authenticated with check (public.softweek_is_parent_for_family(family_id));

drop policy if exists "notification preferences parent all" on public.notification_preferences;
create policy "notification preferences parent all" on public.notification_preferences for all to authenticated using (public.softweek_is_parent_for_family(family_id)) with check (public.softweek_is_parent_for_family(family_id));

drop policy if exists "reminder deliveries parent read" on public.reminder_deliveries;
create policy "reminder deliveries parent read" on public.reminder_deliveries for select to authenticated using (public.softweek_is_parent_for_family(family_id));

-- Transactional bulk move used by Life Happened and undo.
create or replace function public.softweek_bulk_move_planner_items(p_changes jsonb, p_event_name text default 'bulk_move')
returns setof public.planner_items
language plpgsql
security definer
set search_path = public
as $$
declare
  v_change jsonb;
  v_item public.planner_items%rowtype;
begin
  if auth.uid() is null then raise exception 'Not signed in'; end if;

  for v_change in select * from jsonb_array_elements(coalesce(p_changes, '[]'::jsonb))
  loop
    select * into v_item from public.planner_items where id = v_change ->> 'id' and deleted_at is null for update;
    if v_item.id is null then raise exception 'Planner item not found'; end if;
    if not public.softweek_is_parent_for_family(v_item.family_id) then raise exception 'Not allowed'; end if;

    update public.planner_items
    set week_start = coalesce(nullif(v_change ->> 'weekStart', '')::date, week_start),
        day_of_week = case when v_change ? 'day' then nullif(v_change ->> 'day', '') else day_of_week end,
        placement = coalesce(nullif(v_change ->> 'placement', ''), placement),
        status = coalesce(nullif(v_change ->> 'status', ''), status),
        updated_by = auth.uid(),
        updated_at = now()
    where id = v_item.id
    returning * into v_item;

    insert into public.planner_item_events (
      family_id, planner_item_id, event_name, from_week_start, to_week_start, from_day, to_day, metadata, created_by
    ) values (
      v_item.family_id,
      v_item.id,
      p_event_name,
      nullif(v_change ->> 'fromWeekStart', '')::date,
      v_item.week_start,
      nullif(v_change ->> 'fromDay', ''),
      v_item.day_of_week,
      coalesce(v_change -> 'metadata', '{}'::jsonb),
      auth.uid()
    );

    return next v_item;
  end loop;
end;
$$;
revoke all on function public.softweek_bulk_move_planner_items(jsonb, text) from public;
grant execute on function public.softweek_bulk_move_planner_items(jsonb, text) to authenticated;

-- Child accounts can update progress; Flexible and Independent levels may also reschedule permitted work.
create or replace function public.softweek_guard_child_plan_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text;
  v_permission text;
begin
  select p.role, c.permission_level
    into v_role, v_permission
  from public.profiles p
  left join public.children c on c.id = p.child_id and c.family_id = p.family_id
  where p.id = auth.uid()
  limit 1;

  if v_role = 'child' then
    -- All child levels may update status, actual notes, completion date/time, and updated_at.
    if new.id is distinct from old.id
      or new.family_id is distinct from old.family_id
      or new.title is distinct from old.title
      or new.category_slug is distinct from old.category_slug
      or new.time_block is distinct from old.time_block
      or new.assigned_to_child_id is distinct from old.assigned_to_child_id
      or new.notes is distinct from old.notes
      or new.resource_title is distinct from old.resource_title
      or new.resource_url is distinct from old.resource_url
      or new.source_rhythm_id is distinct from old.source_rhythm_id
      or new.source_lesson_stack_item_id is distinct from old.source_lesson_stack_item_id
      or new.created_by is distinct from old.created_by
      or (new.updated_by is distinct from old.updated_by and new.updated_by is distinct from auth.uid())
      or new.created_at is distinct from old.created_at
      or new.deleted_at is distinct from old.deleted_at then
        raise exception 'Child accounts can only update permitted progress fields';
    end if;

    -- Flexible and Independent accounts may reschedule assigned or family-wide work.
    if (new.week_start is distinct from old.week_start
      or new.day_of_week is distinct from old.day_of_week
      or new.placement is distinct from old.placement
      or new.order_index is distinct from old.order_index)
      and coalesce(v_permission, 'checklist') not in ('flexible', 'independent') then
        raise exception 'This child account cannot move planner items';
    end if;
  end if;
  return new;
end;
$$;

revoke all on function public.softweek_guard_child_plan_update() from public, anon, authenticated;

drop trigger if exists softweek_guard_child_plan_update on public.planner_items;
create trigger softweek_guard_child_plan_update before update on public.planner_items for each row execute function public.softweek_guard_child_plan_update();

-- Keep Lesson Stack progress aligned with linked planner work, including child completions.
create or replace function public.softweek_sync_lesson_stack_progress()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'UPDATE'
    and old.source_lesson_stack_item_id is not null
    and old.source_lesson_stack_item_id is distinct from new.source_lesson_stack_item_id then
    update public.lesson_stack_items
    set status = 'queued', planner_item_id = null, completed_at = null, updated_at = now()
    where id = old.source_lesson_stack_item_id
      and family_id = old.family_id
      and planner_item_id = old.id
      and deleted_at is null;
  end if;

  if new.source_lesson_stack_item_id is null then
    return new;
  end if;

  update public.lesson_stack_items
  set status = case
        when new.deleted_at is not null then 'queued'
        when new.status = 'done' then 'done'
        when new.status = 'skipped' then 'skipped'
        else 'planned'
      end,
      planner_item_id = case when new.deleted_at is not null then null else new.id end,
      completed_at = case when new.deleted_at is null and new.status = 'done' then coalesce(new.completed_at, now()) else null end,
      updated_at = now()
  where id = new.source_lesson_stack_item_id
    and family_id = new.family_id
    and deleted_at is null;

  return new;
end;
$$;

revoke all on function public.softweek_sync_lesson_stack_progress() from public, anon, authenticated;

drop trigger if exists softweek_sync_lesson_stack_progress on public.planner_items;
drop trigger if exists softweek_sync_lesson_stack_progress_insert on public.planner_items;
create trigger softweek_sync_lesson_stack_progress_insert
after insert on public.planner_items
for each row execute function public.softweek_sync_lesson_stack_progress();

drop trigger if exists softweek_sync_lesson_stack_progress_update on public.planner_items;
create trigger softweek_sync_lesson_stack_progress_update
after update of status, completed_at, deleted_at, source_lesson_stack_item_id
on public.planner_items
for each row execute function public.softweek_sync_lesson_stack_progress();

-- Useful retention views. These contain family-level aggregates, not lesson content.
create or replace view public.softweek_retention_funnel as
select
  family_id,
  min(created_at) filter (where event_name = 'account_created') as signed_up_at,
  min(created_at) filter (where event_name = 'first_item_created') as first_item_at,
  min(created_at) filter (where event_name = 'third_item_created') as third_item_at,
  min(created_at) filter (where event_name = 'first_item_completed') as first_completion_at,
  min(created_at) filter (where event_name = 'next_week_created') as first_next_week_at,
  count(*) filter (where event_name = 'week_opened') as week_opens,
  count(*) filter (where event_name = 'life_happened_applied') as recovery_uses,
  count(*) filter (where event_name = 'rhythm_created') as rhythms_created
from public.app_events
group by family_id;

create or replace view public.softweek_weekly_family_activity as
select family_id, date_trunc('week', created_at) as activity_week, count(distinct user_id) as active_users, count(*) as events
from public.app_events
group by family_id, date_trunc('week', created_at);

-- Analytics aggregates are service-side operational data. Do not expose cross-family
-- activity to normal application roles through owner-privileged views.
revoke all on public.softweek_retention_funnel from public, anon, authenticated;
revoke all on public.softweek_weekly_family_activity from public, anon, authenticated;
grant select on public.softweek_retention_funnel to service_role;
grant select on public.softweek_weekly_family_activity to service_role;

-- Child accounts may read only their own child profile. Parents/admins retain family access.
drop policy if exists "children read family" on public.children;
create policy "children read permitted" on public.children
for select to authenticated
using (
  public.softweek_is_parent_for_family(family_id)
  or public.softweek_is_admin()
  or exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.role = 'child'
      and p.family_id = children.family_id
      and p.child_id = children.id
  )
);


-- Saved-week snapshots may contain several children's work in one JSON document.
-- Keep those full family records parent/admin-only so a child account cannot read sibling history.
drop policy if exists "saved weeks read family" on public.saved_weeks;
drop policy if exists "saved weeks parent read" on public.saved_weeks;
create policy "saved weeks parent read" on public.saved_weeks
for select to authenticated
using (public.softweek_is_parent_for_family(family_id) or public.softweek_is_admin());
