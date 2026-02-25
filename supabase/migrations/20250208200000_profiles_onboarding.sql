-- Profiles for app-level user settings (e.g. onboarding).
-- Run via: supabase db push, or paste in SQL Editor.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  onboarding_completed boolean not null default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.profiles
  add column if not exists onboarding_completed boolean not null default false,
  add column if not exists updated_at timestamptz default now();

-- Optional: RLS so users can only read/update own profile
-- alter table public.profiles enable row level security;
-- create policy "Users can read own profile" on public.profiles for select using (auth.uid() = id);
-- create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
-- create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = id);
