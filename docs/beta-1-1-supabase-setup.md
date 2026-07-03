# SoftWeek Beta 1.1 Supabase setup

## 1. Run the database schema

Open Supabase, go to SQL Editor, and run:

```txt
supabase/beta-1-1-schema.sql
```

That creates the SoftWeek tables, security rules, parent workspaces, child invite flow, saved weekly records, and the paid/free tracking fields.

## 2. Add environment variables locally

Create `.env.local` from `.env.local.example`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://htetaxzyzebsfaahxeao.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_PqhKTke9SEhVZqsHp2c5Rg_06yrZ-y7
```

Do not use the Supabase service role key in the browser.

## 3. Add the same variables in Vercel

Vercel project → Settings → Environment Variables:

```txt
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
```

Then redeploy.

## 4. Auth settings

For easiest Beta 1.1 testing, use email/password accounts. In Supabase Auth, make sure your Site URL and Redirect URLs include:

```txt
https://softweekplanner.com
http://localhost:3000
```

If email confirmation is on, new users will need to confirm their email before logging in. If you want smoother testing, turn confirmation off during private beta.

## 5. Admin account

The schema adds this email to the admin allowlist:

```txt
altifygenerator@gmail.com
```

When that email creates a parent account, it gets admin access and premium features enabled. To use a different admin email, run this before creating the account:

```sql
insert into public.admin_allowlist (email)
values ('your-email@example.com')
on conflict (email) do nothing;
```

If the admin account already exists, set it manually:

```sql
update public.profiles
set is_admin = true
where lower(email) = 'your-email@example.com';

update public.families
set plan_tier = 'admin', subscription_status = 'admin', premium_features_enabled = true
where owner_user_id in (
  select id from public.profiles where lower(email) = 'your-email@example.com'
);
```

## 6. Beta-to-paid safety

Beta families can use premium-style features for free now. Later, if a family moves to the free plan, the data model is meant to preserve old records instead of deleting them. The free plan should limit creating new premium records after the limit, not erase saved children, weeks, monthly history, or yearly history.
