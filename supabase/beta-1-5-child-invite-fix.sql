-- SoftWeek Beta 1.5 child invite fix
-- Run this if clicking "Child access" says the child invite could not be created.
-- It makes the invite function safe to re-run, reuses an open invite when one exists,
-- and makes sure authenticated parent accounts can call the function.

create extension if not exists pgcrypto;

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

alter table public.child_account_invites
  add column if not exists child_name text not null default 'Student',
  add column if not exists invite_code text,
  add column if not exists created_by uuid references auth.users(id) on delete cascade,
  add column if not exists expires_at timestamptz,
  add column if not exists accepted_at timestamptz,
  add column if not exists accepted_user_id uuid references auth.users(id) on delete set null;

create unique index if not exists child_account_invites_invite_code_unique
  on public.child_account_invites(invite_code)
  where invite_code is not null;

create index if not exists child_invites_family_child_idx
  on public.child_account_invites(family_id, child_id);

alter table public.child_account_invites enable row level security;

drop policy if exists "child invites parent read" on public.child_account_invites;
drop policy if exists "child invites parent insert" on public.child_account_invites;
drop policy if exists "child invites parent update" on public.child_account_invites;

create policy "child invites parent read" on public.child_account_invites
for select to authenticated
using (public.softweek_is_parent_for_family(family_id) or public.softweek_is_admin());

create policy "child invites parent insert" on public.child_account_invites
for insert to authenticated
with check (public.softweek_is_parent_for_family(family_id) or public.softweek_is_admin());

create policy "child invites parent update" on public.child_account_invites
for update to authenticated
using (public.softweek_is_parent_for_family(family_id) or public.softweek_is_admin())
with check (public.softweek_is_parent_for_family(family_id) or public.softweek_is_admin());

drop function if exists public.create_child_account_invite(text, text);

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
    and role = 'parent'
  limit 1;

  if v_family_id is null then
    raise exception 'Only parent accounts can create child invites';
  end if;

  if not exists (
    select 1
    from public.children
    where id = p_child_id
      and family_id = v_family_id
      and archived_at is null
  ) then
    raise exception 'Child profile not found for this parent account';
  end if;

  select child_account_invites.id, child_account_invites.invite_code
    into v_invite_id, v_invite_code
  from public.child_account_invites
  where family_id = v_family_id
    and child_id = p_child_id
    and accepted_at is null
    and (expires_at is null or expires_at > now())
  order by created_at desc
  limit 1;

  if v_invite_id is not null then
    return query select v_invite_id, v_invite_code;
    return;
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

grant execute on function public.create_child_account_invite(text, text) to authenticated;
