-- Published sites: one row per published resume (slug-based for now; subdomain later).
-- RLS: users can manage only their own published sites.

create table if not exists public.published_sites (
  id uuid primary key default gen_random_uuid(),
  resume_id uuid not null references public.resumes(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  site_slug text not null,
  subdomain text,
  is_published boolean not null default true,
  published_at timestamptz not null default now(),
  published_url text,
  template_id text,
  site_data jsonb not null default '{}',
  updated_at timestamptz not null default now(),
  constraint published_sites_slug_unique unique (site_slug)
);

create index if not exists idx_published_sites_slug on public.published_sites(site_slug);
create index if not exists idx_published_sites_resume_id on public.published_sites(resume_id);
create index if not exists idx_published_sites_user_id on public.published_sites(user_id);

alter table public.published_sites enable row level security;

drop policy if exists "Users can manage own published sites" on public.published_sites;
create policy "Users can manage own published sites" on public.published_sites
  for all using (auth.uid() = user_id);

-- Anyone can read published sites by slug (for public view).
drop policy if exists "Public can read published sites by slug" on public.published_sites;
create policy "Public can read published sites by slug" on public.published_sites
  for select using (is_published = true);

comment on table public.published_sites is 'Published resume sites: slug-based URLs now; subdomain support later.';
