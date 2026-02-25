-- Resume parsing: source, basics, and blocks.
-- Run in Supabase SQL editor or via supabase db push.

-- Resumes: add columns for source, parsed basics, and template (if not exists)
alter table public.resumes
  add column if not exists source_text text,
  add column if not exists file_path text,
  add column if not exists basics jsonb default '{}',
  add column if not exists template_id text;

-- resume_blocks: one row per block (section) per resume
create table if not exists public.resume_blocks (
  id uuid primary key default gen_random_uuid(),
  resume_id uuid not null references public.resumes(id) on delete cascade,
  type text not null,
  content jsonb default '{}',
  sort_order int not null default 0,
  created_at timestamptz default now()
);

create index if not exists idx_resume_blocks_resume_id on public.resume_blocks(resume_id);

-- RLS (enable if you use RLS on resumes)
-- alter table public.resume_blocks enable row level security;
-- create policy "Users can manage blocks of own resumes" on public.resume_blocks
--   for all using (
--     exists (select 1 from public.resumes r where r.id = resume_blocks.resume_id and r.user_id = auth.uid())
--   );
