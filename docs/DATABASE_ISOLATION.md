# Database isolation and mixed-account data

## Why you might see another account's resumes (or blank ones)

Resumes are stored in `public.resumes` with a `user_id` column that should match the logged-in user. If you see projects you created in a **different account**, or a lot of **blank** resumes, common causes are:

1. **Row Level Security (RLS) not enabled**  
   Without RLS, the app still filters by `user_id` in code, so you should only see rows where `user_id` = your current user. If RLS was never applied and something wrote the wrong `user_id` in the past, those rows would show up for the wrong account.

2. **Resumes created with the wrong account**  
   If you had multiple tabs or sessions (e.g. one with your main account, one with `me@mum`), creating a resume in one tab might have used the other account’s session, so `user_id` could belong to the other account. With RLS enabled, you would only see your own rows; without RLS you could see rows that don’t match the UI’s idea of “current user” if there was a bug.

3. **Blank resumes**  
   These are usually drafts that were created (so a row exists) but never filled—e.g. you clicked “Create” or “Upload” and then left, or the structuring step didn’t complete. You can delete them from the dashboard (trash icon).

## What the app does now

- **Dashboard**  
  - “Your Resumes” and “Your Projects” both load only rows where `user_id` = current user (and, if RLS is on, the database enforces that).
  - A line like “Signed in as **you@example.com**” confirms which account you’re using.
  - **Delete**: Use the trash icon on a resume/project to delete it. Deletion is permanent.

- **Editor**  
  - Before loading a resume, the app checks that the row’s `user_id` matches the logged-in user. If it doesn’t, you see: “You don't have access to this resume. It belongs to another account.”

So even if the database had mixed or wrong `user_id` in the past, you only see and edit resumes that belong to the account you’re signed in as, and you can remove blank or wrong ones with delete.

## Ensure Row Level Security (RLS) is enabled

RLS guarantees that each user can only read/update/delete their own rows, regardless of app bugs.

1. In the Supabase dashboard, open **SQL Editor** and run the migrations under `supabase/migrations/`, especially:
   - `20250208100000_resumes_full_schema.sql` (creates/updates `resumes` table)
   - `20250208210000_full_schema_rls_triggers.sql` (enables RLS and policies)

2. Or, if you use the Supabase CLI and have linked your project:
   ```bash
   npx supabase db push
   ```

3. To confirm RLS is on for `resumes`:
   ```sql
   SELECT relname, relrowsecurity
   FROM pg_class
   WHERE relname = 'resumes';
   ```
   `relrowsecurity` should be `true`.

After RLS is enabled, only rows with `user_id = auth.uid()` are visible to that user, so accounts are isolated at the database level.

## Cleaning up data (optional)

If you want to remove resumes that don’t belong to the current user (e.g. after fixing a bug that wrote the wrong `user_id`), do that in the Supabase SQL Editor as a superuser, for example:

```sql
-- List resumes and their owner (auth.users.email if you have it)
-- SELECT id, user_id, title, updated_at FROM public.resumes;

-- Delete only if you’re sure (replace USER_ID with the correct auth user uuid)
-- DELETE FROM public.resumes WHERE user_id = 'wrong-user-uuid';
```

Normally you don’t need to run these; the app’s ownership check and delete are enough for day-to-day use.
