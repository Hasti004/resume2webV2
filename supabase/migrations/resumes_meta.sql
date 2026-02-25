-- Add meta jsonb to resumes for intake and other structured data.
-- Run in Supabase SQL editor if your resumes table doesn't have meta yet.

-- If creating the table from scratch:
-- create table if not exists public.resumes (
--   id uuid primary key default gen_random_uuid(),
--   user_id uuid not null references auth.users(id) on delete cascade,
--   title text default 'Untitled Resume',
--   meta jsonb default '{}',
--   created_at timestamptz default now(),
--   updated_at timestamptz default now()
-- );

-- If table exists but missing meta:
alter table public.resumes
  add column if not exists meta jsonb default '{}';

-- RLS (adjust policy as needed):
-- alter table public.resumes enable row level security;
-- create policy "Users can manage own resumes" on public.resumes
--   for all using (auth.uid() = user_id);
