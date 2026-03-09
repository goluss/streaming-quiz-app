-- ============================================================
-- 018: Add cohort_id to test_attempts for unified tracking
-- ============================================================

-- 1. Add nullable cohort_id column
alter table public.test_attempts
  add column if not exists cohort_id uuid references public.cohorts(id) on delete cascade;

-- 2. Backfill cohort_id from the tests table for graded attempts
update public.test_attempts
set cohort_id = tests.cohort_id
from public.tests
where test_attempts.test_id = tests.id
  and test_attempts.cohort_id is null;

-- 3. Update RLS: Ensure students can insert with their own cohort_id
-- (The existing "attempts: own insert" with check (user_id = auth.uid()) is still valid,
-- and the admin full access is also covered by profiles roles.)

-- Create index for performance
create index if not exists idx_attempts_cohort on public.test_attempts(cohort_id);
