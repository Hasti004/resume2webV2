-- Resume2Web — Full schema, RLS, and updated_at triggers.
-- Apply once after initial setup. Safe to run with IF NOT EXISTS / ADD COLUMN IF NOT EXISTS.

-- ============= PROFILES =============
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  onboarding_completed boolean not null default false,
  onboarding_completed_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.profiles
  add column if not exists onboarding_completed boolean not null default false,
  add column if not exists onboarding_completed_at timestamptz,
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

-- ============= RESUMES =============
create table if not exists public.resumes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text default 'Untitled Resume',
  status text default 'draft',
  template_id text,
  basics jsonb default '{}',
  meta jsonb default '{}',
  source_text text,
  file_path text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.resumes
  add column if not exists title text default 'Untitled Resume',
  add column if not exists status text default 'draft',
  add column if not exists template_id text,
  add column if not exists basics jsonb default '{}',
  add column if not exists meta jsonb default '{}',
  add column if not exists source_text text,
  add column if not exists file_path text,
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

create index if not exists idx_resumes_user_id on public.resumes(user_id);
create index if not exists idx_resumes_updated_at on public.resumes(updated_at desc);

-- ============= RESUME_BLOCKS =============
-- App uses "content" and "sort_order"; spec used "data" and "order_index". We keep content/sort_order for compatibility.
create table if not exists public.resume_blocks (
  id uuid primary key default gen_random_uuid(),
  resume_id uuid not null references public.resumes(id) on delete cascade,
  type text not null,
  title text,
  content jsonb default '{}',
  sort_order int not null default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.resume_blocks
  add column if not exists title text,
  add column if not exists content jsonb default '{}',
  add column if not exists sort_order int not null default 0,
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

create index if not exists idx_resume_blocks_resume_id on public.resume_blocks(resume_id);

-- ============= RESUME_FILES =============
create table if not exists public.resume_files (
  id uuid primary key default gen_random_uuid(),
  resume_id uuid not null references public.resumes(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  original_name text,
  storage_path text not null,
  mime_type text,
  size_bytes bigint,
  created_at timestamptz default now()
);

create index if not exists idx_resume_files_resume_id on public.resume_files(resume_id);
create index if not exists idx_resume_files_user_id on public.resume_files(user_id);

-- ============= ADMIN_ROLES (optional) =============
create table if not exists public.admin_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'admin',
  created_at timestamptz default now()
);

-- ============= UPDATED_AT TRIGGERS =============
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists set_resumes_updated_at on public.resumes;
create trigger set_resumes_updated_at
  before update on public.resumes
  for each row execute function public.set_updated_at();

drop trigger if exists set_resume_blocks_updated_at on public.resume_blocks;
create trigger set_resume_blocks_updated_at
  before update on public.resume_blocks
  for each row execute function public.set_updated_at();

-- ============= RLS =============
alter table public.profiles enable row level security;
alter table public.resumes enable row level security;
alter table public.resume_blocks enable row level security;
alter table public.resume_files enable row level security;
alter table public.admin_roles enable row level security;

-- Profiles: own row only
drop policy if exists "Users can read own profile" on public.profiles;
create policy "Users can read own profile" on public.profiles for select using (auth.uid() = id);
drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = id);

-- Resumes: own rows only
drop policy if exists "Users can manage own resumes" on public.resumes;
create policy "Users can manage own resumes" on public.resumes for all using (auth.uid() = user_id);

-- Resume blocks: via resume ownership
drop policy if exists "Users can manage blocks of own resumes" on public.resume_blocks;
create policy "Users can manage blocks of own resumes" on public.resume_blocks for all using (
  exists (select 1 from public.resumes r where r.id = resume_blocks.resume_id and r.user_id = auth.uid())
);

-- Resume files: own rows only
drop policy if exists "Users can manage own resume files" on public.resume_files;
create policy "Users can manage own resume files" on public.resume_files for all using (auth.uid() = user_id);

-- Admin roles: only admins can read (optional; adjust as needed)
drop policy if exists "Admins can read admin_roles" on public.admin_roles;
create policy "Admins can read admin_roles" on public.admin_roles for select using (
  exists (select 1 from public.admin_roles ar where ar.user_id = auth.uid())
);
