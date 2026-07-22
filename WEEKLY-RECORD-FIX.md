# Weekly record save correction

## Problem

Beta 2.0 generated automatic record IDs from only the week start, for example:

```text
week-record-2026-07-20
```

`saved_weeks.id` is a global primary key. When another family had already created that week's record, Supabase correctly blocked a different family from updating the row through RLS. The planner item itself could be saved, but the background record upsert failed and the interface misleadingly changed the overall state to **Could not save**.

## Application correction

`saveWeekLog` now:

1. Looks up an existing record belonging to the current family and week.
2. Reuses that row when found.
3. Otherwise creates a family-scoped ID:

```text
week-record:<family-id>:<week-start>
```

4. Converts Supabase error objects into useful JavaScript errors.
5. Keeps background record warnings separate from planner-item synchronization status.

## Database correction

Run this after Beta 2.0:

```text
supabase/beta-2-1-week-record-scope-fix.sql
```

The app code works without the cleanup migration, but the migration safely renames legacy automatic rows already stored in `saved_weeks`.

## Deployment

```powershell
npm run build
git add -A
git commit -m "Fix family-scoped automatic weekly records"
git push
```

After Vercel deploys, refresh the planner. The top status should remain **Saved** when the planner item succeeds. A background record problem, if one remains, is shown separately and the detailed Supabase error is logged in the browser console.
