-- ============================================================
-- Phase 4: Cohorts & Leaderboards
-- ============================================================

create table if not exists public.cohorts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

-- Profiles belong to a cohort
alter table public.profiles 
  add column if not exists cohort_id uuid references public.cohorts(id) on delete set null;

-- Tests optionally target a cohort
alter table public.tests
  add column if not exists cohort_id uuid references public.cohorts(id) on delete set null;

-- RLS
alter table public.cohorts enable row level security;

-- cohorts: admins full access
create policy "cohorts: admin all" on public.cohorts
  for all using (is_admin());

-- cohorts: students can read cohorts they are in
create policy "cohorts: student read" on public.cohorts
  for select using (id = (select cohort_id from public.profiles where profiles.id = auth.uid()));

create index if not exists idx_profiles_cohort on public.profiles(cohort_id);
create index if not exists idx_tests_cohort on public.tests(cohort_id);
