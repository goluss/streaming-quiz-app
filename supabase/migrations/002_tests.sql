-- ============================================================
-- Phase 3: Tests (Assignments)
-- ============================================================

create table if not exists public.tests (
  id uuid primary key default gen_random_uuid(),
  transcript_id uuid references public.transcripts(id) on delete cascade,
  name text not null,
  code varchar(6) unique not null,
  is_active boolean not null default true,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Update test_attempts to link to tests
alter table public.test_attempts 
  add column if not exists test_id uuid references public.tests(id) on delete cascade;

-- RLS
alter table public.tests enable row level security;

-- tests: admins full-access
create policy "tests: admin all" on public.tests
  for all using (is_admin());

-- tests: students can read active tests
create policy "tests: student read active" on public.tests
  for select using (is_active = true and auth.uid() is not null);

create index if not exists idx_tests_code on public.tests(code);
create index if not exists idx_attempts_test on public.test_attempts(test_id);
