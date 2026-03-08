-- ============================================================
-- 013: Multi-Cohort Membership & Class Sessions
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. student_cohorts junction table (many-to-many)
-- ────────────────────────────────────────────────────────────
create table if not exists public.student_cohorts (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  cohort_id  uuid not null references public.cohorts(id) on delete cascade,
  joined_at  timestamptz not null default now(),
  unique (user_id, cohort_id)
);

alter table public.student_cohorts enable row level security;

-- Admins can do everything
create policy "student_cohorts: admin all" on public.student_cohorts
  for all
  using (exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = 'admin'))
  with check (exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = 'admin'));

-- Students can read their own memberships
create policy "student_cohorts: student read own" on public.student_cohorts
  for select
  using (user_id = auth.uid());

-- Migrate existing single-cohort assignments
insert into public.student_cohorts (user_id, cohort_id)
  select id, cohort_id
  from public.profiles
  where cohort_id is not null
on conflict (user_id, cohort_id) do nothing;


-- ────────────────────────────────────────────────────────────
-- 2. cohort_sessions table
-- ────────────────────────────────────────────────────────────
create table if not exists public.cohort_sessions (
  id          uuid primary key default gen_random_uuid(),
  cohort_id   uuid not null references public.cohorts(id) on delete cascade,
  title       text not null,
  description text,
  created_at  timestamptz not null default now()
);

alter table public.cohort_sessions enable row level security;

-- Admins full access
create policy "cohort_sessions: admin all" on public.cohort_sessions
  for all
  using (exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = 'admin'))
  with check (exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = 'admin'));

-- Students can view sessions for cohorts they belong to
create policy "cohort_sessions: student read" on public.cohort_sessions
  for select
  using (
    exists (
      select 1 from public.student_cohorts
      where student_cohorts.user_id = auth.uid()
        and student_cohorts.cohort_id = cohort_sessions.cohort_id
    )
  );

create index if not exists idx_cohort_sessions_cohort on public.cohort_sessions(cohort_id);


-- ────────────────────────────────────────────────────────────
-- 3. Add session_id FK to cohort_resources (nullable)
-- ────────────────────────────────────────────────────────────
alter table public.cohort_resources
  add column if not exists session_id uuid references public.cohort_sessions(id) on delete cascade;

create index if not exists idx_cohort_resources_session on public.cohort_resources(session_id);


-- ────────────────────────────────────────────────────────────
-- 4. Update RLS: cohort_resources student read via student_cohorts
-- ────────────────────────────────────────────────────────────
drop policy if exists "Students can view assigned cohort resources" on public.cohort_resources;

create policy "Students can view assigned cohort resources" on public.cohort_resources
  for select
  using (
    exists (
      select 1 from public.student_cohorts
      where student_cohorts.user_id = auth.uid()
        and student_cohorts.cohort_id = cohort_resources.cohort_id
    )
  );


-- ────────────────────────────────────────────────────────────
-- 5. Update RLS: cohorts student read via student_cohorts
-- ────────────────────────────────────────────────────────────
drop policy if exists "cohorts: student read" on public.cohorts;

create policy "cohorts: student read" on public.cohorts
  for select
  using (
    exists (
      select 1 from public.student_cohorts
      where student_cohorts.user_id = auth.uid()
        and student_cohorts.cohort_id = cohorts.id
    )
  );
