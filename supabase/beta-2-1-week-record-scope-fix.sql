-- SoftWeek Beta 2.1: scope automatic weekly-record IDs to each family.
--
-- Earlier Beta 2.0 application code used IDs such as
--   week-record-2026-07-20
-- for automatic records. saved_weeks.id is a global primary key, so only one
-- family could own that value. Later families opening the same week received an
-- RLS/upsert failure even though their planner-item save had succeeded.
--
-- The application fix no longer depends on this migration: it reuses the
-- current family's record or creates a family-scoped ID. This migration simply
-- cleans up legacy automatic IDs already stored in the database.

begin;

-- If a correctly scoped row already exists for the same family/week, retire the
-- obsolete legacy row instead of creating a duplicate primary key.
update public.saved_weeks legacy
set deleted_at = coalesce(legacy.deleted_at, now()),
    updated_at = now()
where legacy.period_type = 'week'
  and legacy.id ~ '^week-record-[0-9]{4}-[0-9]{2}-[0-9]{2}$'
  and exists (
    select 1
    from public.saved_weeks scoped
    where scoped.id = 'week-record:' || legacy.family_id::text || ':' || legacy.period_start::text
      and scoped.id <> legacy.id
  );

-- Rename remaining legacy automatic rows to a family-scoped key and keep the
-- embedded JSON snapshot ID aligned with the database row ID.
with legacy_rows as (
  select
    id as old_id,
    'week-record:' || family_id::text || ':' || period_start::text as new_id
  from public.saved_weeks
  where period_type = 'week'
    and deleted_at is null
    and id ~ '^week-record-[0-9]{4}-[0-9]{2}-[0-9]{2}$'
), updated as (
  update public.saved_weeks saved
  set id = legacy.new_id,
      snapshot = jsonb_set(
        coalesce(saved.snapshot, '{}'::jsonb),
        '{id}',
        to_jsonb(legacy.new_id),
        true
      ),
      updated_at = now()
  from legacy_rows legacy
  where saved.id = legacy.old_id
    and not exists (
      select 1
      from public.saved_weeks conflict_row
      where conflict_row.id = legacy.new_id
    )
  returning saved.id
)
select count(*) as renamed_legacy_week_records from updated;

commit;

notify pgrst, 'reload schema';
