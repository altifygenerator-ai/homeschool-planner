-- SoftWeek retention queries. Run after beta-2-0-retention-redesign.sql.

-- Signup to first and third useful item.
select
  count(*) filter (where signed_up_at is not null) as signups,
  count(*) filter (where first_item_at is not null) as first_item_families,
  round(100.0 * count(*) filter (where first_item_at is not null) / nullif(count(*) filter (where signed_up_at is not null), 0), 1) as signup_to_first_item_pct,
  round(100.0 * count(*) filter (where third_item_at is not null) / nullif(count(*) filter (where signed_up_at is not null), 0), 1) as signup_to_third_item_pct
from public.softweek_retention_funnel;

-- First item completion.
select round(100.0 * count(*) filter (where first_completion_at is not null) / nullif(count(*) filter (where first_item_at is not null), 0), 1) as first_item_completion_pct
from public.softweek_retention_funnel;

-- Next-day and seven-day family return based on distinct active dates.
with first_activity as (
  select family_id, min(created_at)::date as first_date from public.app_events group by family_id
), activity as (
  select distinct family_id, created_at::date as active_date from public.app_events
)
select
  round(100.0 * count(*) filter (where exists (select 1 from activity a where a.family_id = f.family_id and a.active_date = f.first_date + 1)) / nullif(count(*), 0), 1) as next_day_return_pct,
  round(100.0 * count(*) filter (where exists (select 1 from activity a where a.family_id = f.family_id and a.active_date between f.first_date + 7 and f.first_date + 13)) / nullif(count(*), 0), 1) as seven_day_return_pct
from first_activity f;

-- Weekly active families.
select date_trunc('week', created_at)::date as week_start, count(distinct family_id) as weekly_active_families
from public.app_events
where family_id is not null
group by 1
order by 1 desc;

-- Adoption of retention tools among active families.
with active as (select distinct family_id from public.app_events where created_at >= now() - interval '28 days')
select
  round(100.0 * count(distinct family_id) filter (where event_name = 'week_inbox_item_created') / nullif((select count(*) from active), 0), 1) as using_this_week_pct,
  round(100.0 * count(distinct family_id) filter (where event_name = 'life_happened_applied') / nullif((select count(*) from active), 0), 1) as using_life_happened_pct,
  round(100.0 * count(distinct family_id) filter (where event_name = 'rhythm_created') / nullif((select count(*) from active), 0), 1) as creating_rhythm_pct,
  round(100.0 * count(distinct family_id) filter (where event_name = 'next_week_created') / nullif((select count(*) from active), 0), 1) as setting_up_next_week_pct
from public.app_events
where created_at >= now() - interval '28 days';

-- Reminder click-through.
select
  count(*) filter (where event_name = 'reminder_sent') as sent,
  count(*) filter (where event_name = 'reminder_clicked') as clicked,
  round(100.0 * count(*) filter (where event_name = 'reminder_clicked') / nullif(count(*) filter (where event_name = 'reminder_sent'), 0), 1) as click_through_pct
from public.app_events;

-- Completed versus planned item rows. Records are live byproduct data, not AI summaries.
select
  date_trunc('week', week_start)::date as week_start,
  count(*) as planned_items,
  count(*) filter (where status = 'done') as completed_items,
  round(100.0 * count(*) filter (where status = 'done') / nullif(count(*), 0), 1) as completion_pct
from public.planner_items
where deleted_at is null
group by 1
order by 1 desc;
