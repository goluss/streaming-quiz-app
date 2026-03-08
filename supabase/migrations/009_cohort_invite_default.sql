-- ============================================================
-- Fix Cohort Invite Generation
-- ============================================================

-- Set the default value for invite_code to automatically use the generator
alter table public.cohorts 
  alter column invite_code set default public.generate_cohort_code();
