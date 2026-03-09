-- ============================================================
-- 019: Direct Quiz Access & Code-free Architecture
-- ============================================================

-- 1. Add test_id to cohort_resources
alter table public.cohort_resources
  add column if not exists test_id uuid references public.tests(id) on delete set null;

-- 2. Update type constraint to include 'test'
alter table public.cohort_resources
  drop constraint if exists cohort_resources_type_check;

alter table public.cohort_resources
  add constraint cohort_resources_type_check check (type in ('link', 'document', 'video', 'practice', 'test'));

-- 3. Add index
create index if not exists idx_cohort_resources_test on public.cohort_resources(test_id);
