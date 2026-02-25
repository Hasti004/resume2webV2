-- Ensures public.resumes exists with all columns used by the app (create/upload flow, parsing, editor).
-- Run via: supabase db push, or paste in SQL Editor.

create table if not exists public.resumes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text default 'Untitled Resume',
  meta jsonb default '{}',
  source_text text,
  file_path text,
  basics jsonb default '{}',
  template_id text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Add columns if table already existed without them
alter table public.resumes
  add column if not exists source_text text,
  add column if not exists file_path text,
  add column if not exists basics jsonb default '{}',
  add column if not exists template_id text,
  add column if not exists meta jsonb default '{}',
  add column if not exists updated_at timestamptz default now();
