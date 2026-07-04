-- SoftWeek Planner Beta 1.1 Supabase schema
-- Run this once in the Supabase SQL editor for the SoftWeek project.

create extension if not exists pgcrypto;

create table if not exists public.admin_allowlist (
  email text primary key,
  created_at timestamptz not null default now()
);

insert into public.admin_allowlist (email)
values ('altifygenerator@gmail.com')
on conflict (email) do nothing;

create table if not exists public.families (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  plan_tier text not null default 'beta_free' check (plan_tier in ('beta_free', 'free', 'premium', 'admin')),
  subscription_status text not null default 'beta' check (subscription_status in ('beta', 'free', 'trialing', 'active', 'past_due', 'canceled', 'admin')),
  premium_features_enabled boolean not null default true,
  stripe_customer_id text,
  stripe_subscription_id text,
  free_limit_policy jsonb not null default '{"maxChildren":1,"maxSavedWeeks":8,"preserveExistingRecords":true}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  family_id uuid references public.families(id) on delete cascade,
  display_name text not null default 'Parent',
  email text,
  role text not null default 'parent' check (role in ('parent', 'child')),
  child_id text,
  is_admin boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.children (
  id text primary key,
  family_id uuid not null references public.families(id) on delete cascade,
  name text not null,
  color_label text default 'sage' check (color_label in ('sage', 'gold', 'clay', 'blue')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz
);

create table if not exists public.categories (
  family_id uuid not null references public.families(id) on delete cascade,
  slug text not null,
  label text not null,
  is_custom boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (family_id, slug)
);

create table if not exists public.planner_items (
  id text primary key,
  family_id uuid not null references public.families(id) on delete cascade,
  week_start date not null,
  title text not null,
  day_of_week text not null check (day_of_week in ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')),
  category_slug text not null default 'other',
  status text not null default 'planned' check (status in ('planned', 'done', 'moved', 'skipped')),
  time_block text not null default 'Anytime' check (time_block in ('Morning', 'Midday', 'Afternoon', 'Anytime')),
  assigned_to_child_id text references public.children(id) on delete set null,
  notes text default '',
  actual_notes text default '',
  resource_title text default '',
  resource_url text default '',
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.saved_weeks (
  id text primary key,
  family_id uuid not null references public.families(id) on delete cascade,
  week_label text not null,
  week_start date not null,
  week_end date not null,
  saved_at timestamptz not null default now(),
  period_type text not null default 'week' check (period_type in ('week', 'month', 'year')),
  period_start date not null,
  period_end date not null,
  snapshot jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.child_account_invites (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  child_id text not null references public.children(id) on delete cascade,
  child_name text not null,
  invite_code text not null unique,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz,
  accepted_at timestamptz,
  accepted_user_id uuid references auth.users(id) on delete set null
);

create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  family_id uuid references public.families(id) on delete set null,
  user_id uuid references auth.users(id) on delete set null,
  message text not null,
  page text,
  created_at timestamptz not null default now()
);

create index if not exists families_owner_user_id_idx on public.families(owner_user_id);
create index if not exists profiles_family_id_idx on public.profiles(family_id);
create index if not exists children_family_id_idx on public.children(family_id);
create index if not exists planner_items_family_week_idx on public.planner_items(family_id, week_start);
create index if not exists saved_weeks_family_week_idx on public.saved_weeks(family_id, week_start);
create index if not exists child_invites_family_child_idx on public.child_account_invites(family_id, child_id);

-- Safe additions for Beta 1.2 planner resources.
alter table public.planner_items
  add column if not exists resource_title text default '',
  add column if not exists resource_url text default '';

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists touch_families_updated_at on public.families;
create trigger touch_families_updated_at
before update on public.families
for each row execute function public.touch_updated_at();

drop trigger if exists touch_profiles_updated_at on public.profiles;
create trigger touch_profiles_updated_at
before update on public.profiles
for each row execute function public.touch_updated_at();

drop trigger if exists touch_children_updated_at on public.children;
create trigger touch_children_updated_at
before update on public.children
for each row execute function public.touch_updated_at();

drop trigger if exists touch_categories_updated_at on public.categories;
create trigger touch_categories_updated_at
before update on public.categories
for each row execute function public.touch_updated_at();

drop trigger if exists touch_planner_items_updated_at on public.planner_items;
create trigger touch_planner_items_updated_at
before update on public.planner_items
for each row execute function public.touch_updated_at();

drop trigger if exists touch_saved_weeks_updated_at on public.saved_weeks;
create trigger touch_saved_weeks_updated_at
before update on public.saved_weeks
for each row execute function public.touch_updated_at();

create or replace function public.softweek_is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and is_admin = true
  );
$$;

create or replace function public.softweek_current_family_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select family_id from public.profiles where id = auth.uid() limit 1;
$$;

create or replace function public.softweek_is_parent_for_family(target_family_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and family_id = target_family_id
      and role = 'parent'
  ) or public.softweek_is_admin();
$$;

create or replace function public.softweek_is_member_of_family(target_family_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and family_id = target_family_id
  ) or public.softweek_is_admin();
$$;

create or replace function public.create_parent_workspace(p_display_name text, p_family_name text default null)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_email text := lower(coalesce(auth.jwt() ->> 'email', ''));
  v_family_id uuid;
  v_is_admin boolean;
begin
  if v_user_id is null then
    raise exception 'Not signed in';
  end if;

  select family_id into v_family_id
  from public.profiles
  where id = v_user_id;

  if v_family_id is not null then
    return v_family_id;
  end if;

  v_is_admin := exists (select 1 from public.admin_allowlist where lower(email) = v_email);

  insert into public.families (
    name,
    owner_user_id,
    plan_tier,
    subscription_status,
    premium_features_enabled
  ) values (
    coalesce(nullif(trim(p_family_name), ''), concat(coalesce(nullif(trim(p_display_name), ''), 'SoftWeek'), '''s family')),
    v_user_id,
    case when v_is_admin then 'admin' else 'beta_free' end,
    case when v_is_admin then 'admin' else 'beta' end,
    true
  ) returning id into v_family_id;

  insert into public.profiles (
    id,
    family_id,
    display_name,
    email,
    role,
    is_admin
  ) values (
    v_user_id,
    v_family_id,
    coalesce(nullif(trim(p_display_name), ''), 'Parent'),
    v_email,
    'parent',
    v_is_admin
  );

  return v_family_id;
end;
$$;

create or replace function public.create_child_account_invite(p_child_id text, p_child_name text)
returns table (id uuid, invite_code text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_family_id uuid;
  v_invite_code text;
  v_invite_id uuid;
begin
  if v_user_id is null then
    raise exception 'Not signed in';
  end if;

  select family_id into v_family_id
  from public.profiles
  where id = v_user_id
    and role = 'parent';

  if v_family_id is null and not public.softweek_is_admin() then
    raise exception 'Only parent accounts can create child invites';
  end if;

  if not exists (
    select 1 from public.children
    where id = p_child_id
      and family_id = v_family_id
      and archived_at is null
  ) then
    raise exception 'Child profile not found';
  end if;

  v_invite_code := upper('SW-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));

  insert into public.child_account_invites (
    family_id,
    child_id,
    child_name,
    invite_code,
    created_by,
    expires_at
  ) values (
    v_family_id,
    p_child_id,
    coalesce(nullif(trim(p_child_name), ''), 'Student'),
    v_invite_code,
    v_user_id,
    now() + interval '30 days'
  ) returning child_account_invites.id into v_invite_id;

  return query select v_invite_id, v_invite_code;
end;
$$;

create or replace function public.accept_child_invite(p_display_name text, p_invite_code text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_email text := lower(coalesce(auth.jwt() ->> 'email', ''));
  v_invite public.child_account_invites%rowtype;
begin
  if v_user_id is null then
    raise exception 'Not signed in';
  end if;

  select * into v_invite
  from public.child_account_invites
  where upper(invite_code) = upper(trim(p_invite_code))
    and accepted_at is null
    and (expires_at is null or expires_at > now())
  order by created_at desc
  limit 1;

  if v_invite.id is null then
    raise exception 'Invite code is not valid or has already been used';
  end if;

  insert into public.profiles (
    id,
    family_id,
    display_name,
    email,
    role,
    child_id,
    is_admin
  ) values (
    v_user_id,
    v_invite.family_id,
    coalesce(nullif(trim(p_display_name), ''), v_invite.child_name, 'Student'),
    v_email,
    'child',
    v_invite.child_id,
    false
  ) on conflict (id) do update set
    family_id = excluded.family_id,
    display_name = excluded.display_name,
    email = excluded.email,
    role = 'child',
    child_id = excluded.child_id,
    updated_at = now();

  update public.child_account_invites
  set accepted_at = now(), accepted_user_id = v_user_id
  where id = v_invite.id;

  return v_invite.family_id;
end;
$$;

alter table public.admin_allowlist enable row level security;
alter table public.families enable row level security;
alter table public.profiles enable row level security;
alter table public.children enable row level security;
alter table public.categories enable row level security;
alter table public.planner_items enable row level security;
alter table public.saved_weeks enable row level security;
alter table public.child_account_invites enable row level security;
alter table public.feedback enable row level security;

-- Drop old policies so the script can be re-run safely.
do $$
declare
  pol record;
begin
  for pol in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and tablename in (
        'admin_allowlist','families','profiles','children','categories','planner_items','saved_weeks','child_account_invites','feedback'
      )
  loop
    execute format('drop policy if exists %I on %I.%I', pol.policyname, pol.schemaname, pol.tablename);
  end loop;
end $$;

create policy "admins read allowlist" on public.admin_allowlist
for select to authenticated
using (public.softweek_is_admin());

create policy "families read own" on public.families
for select to authenticated
using (public.softweek_is_member_of_family(id));

create policy "families parent update own" on public.families
for update to authenticated
using (public.softweek_is_parent_for_family(id))
with check (public.softweek_is_parent_for_family(id));

create policy "profiles read family" on public.profiles
for select to authenticated
using (id = auth.uid() or public.softweek_is_member_of_family(family_id));

create policy "profiles update self" on public.profiles
for update to authenticated
using (id = auth.uid() or public.softweek_is_admin())
with check (id = auth.uid() or public.softweek_is_admin());

create policy "children read family" on public.children
for select to authenticated
using (public.softweek_is_member_of_family(family_id));

create policy "children parent insert" on public.children
for insert to authenticated
with check (public.softweek_is_parent_for_family(family_id));

create policy "children parent update" on public.children
for update to authenticated
using (public.softweek_is_parent_for_family(family_id))
with check (public.softweek_is_parent_for_family(family_id));

create policy "categories read family" on public.categories
for select to authenticated
using (public.softweek_is_member_of_family(family_id));

create policy "categories parent insert" on public.categories
for insert to authenticated
with check (public.softweek_is_parent_for_family(family_id));

create policy "categories parent update" on public.categories
for update to authenticated
using (public.softweek_is_parent_for_family(family_id))
with check (public.softweek_is_parent_for_family(family_id));

create policy "categories parent delete" on public.categories
for delete to authenticated
using (public.softweek_is_parent_for_family(family_id));

create policy "plans read family" on public.planner_items
for select to authenticated
using (
  public.softweek_is_parent_for_family(family_id)
  or exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.family_id = planner_items.family_id
      and p.role = 'child'
      and (planner_items.assigned_to_child_id is null or planner_items.assigned_to_child_id = p.child_id)
  )
  or public.softweek_is_admin()
);

create policy "plans parent insert" on public.planner_items
for insert to authenticated
with check (public.softweek_is_parent_for_family(family_id));

create policy "plans parent update" on public.planner_items
for update to authenticated
using (public.softweek_is_parent_for_family(family_id))
with check (public.softweek_is_parent_for_family(family_id));

create policy "plans child update progress" on public.planner_items
for update to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.family_id = planner_items.family_id
      and p.role = 'child'
      and (planner_items.assigned_to_child_id is null or planner_items.assigned_to_child_id = p.child_id)
  )
)
with check (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.family_id = planner_items.family_id
      and p.role = 'child'
      and (planner_items.assigned_to_child_id is null or planner_items.assigned_to_child_id = p.child_id)
  )
);

create policy "plans parent delete" on public.planner_items
for delete to authenticated
using (public.softweek_is_parent_for_family(family_id));

create policy "saved weeks read family" on public.saved_weeks
for select to authenticated
using (public.softweek_is_member_of_family(family_id));

create policy "saved weeks parent insert" on public.saved_weeks
for insert to authenticated
with check (public.softweek_is_parent_for_family(family_id));

create policy "saved weeks parent update" on public.saved_weeks
for update to authenticated
using (public.softweek_is_parent_for_family(family_id))
with check (public.softweek_is_parent_for_family(family_id));

create policy "child invites parent read" on public.child_account_invites
for select to authenticated
using (public.softweek_is_parent_for_family(family_id));

create policy "child invites parent insert" on public.child_account_invites
for insert to authenticated
with check (public.softweek_is_parent_for_family(family_id));

create policy "child invites parent update" on public.child_account_invites
for update to authenticated
using (public.softweek_is_parent_for_family(family_id))
with check (public.softweek_is_parent_for_family(family_id));

create policy "feedback insert signed in" on public.feedback
for insert to authenticated
with check (user_id = auth.uid() or user_id is null);

create policy "feedback admins read" on public.feedback
for select to authenticated
using (public.softweek_is_admin());

-- Beta 1.3 reusable week templates for planning-ahead tools.
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
