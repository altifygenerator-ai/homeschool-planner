-- SoftWeek Beta 1.7 planner redesign child guard
-- Run after the earlier SoftWeek schema migrations.
-- No new tables are required for the Today / Plan Week redesign.
-- This trigger makes sure child accounts can only update progress fields
-- on plans they can already see: status, actual_notes, and updated_at.

create or replace function public.softweek_guard_child_plan_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text;
begin
  select role into v_role
  from public.profiles
  where id = auth.uid()
  limit 1;

  if v_role = 'child' then
    if new.id is distinct from old.id
      or new.family_id is distinct from old.family_id
      or new.week_start is distinct from old.week_start
      or new.title is distinct from old.title
      or new.day_of_week is distinct from old.day_of_week
      or new.category_slug is distinct from old.category_slug
      or new.time_block is distinct from old.time_block
      or new.assigned_to_child_id is distinct from old.assigned_to_child_id
      or new.notes is distinct from old.notes
      or new.resource_title is distinct from old.resource_title
      or new.resource_url is distinct from old.resource_url
      or new.created_by is distinct from old.created_by
      or new.updated_by is distinct from old.updated_by
      or new.created_at is distinct from old.created_at
      or new.deleted_at is distinct from old.deleted_at then
        raise exception 'Child accounts can only update plan status and notes';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists softweek_guard_child_plan_update on public.planner_items;
create trigger softweek_guard_child_plan_update
before update on public.planner_items
for each row execute function public.softweek_guard_child_plan_update();
