-- SoftWeek Beta 1.2 resource link fields
-- Run this if your Supabase project already has the Beta 1.1 tables.

alter table public.planner_items
  add column if not exists resource_title text default '',
  add column if not exists resource_url text default '';
