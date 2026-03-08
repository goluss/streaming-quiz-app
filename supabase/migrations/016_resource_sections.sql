-- ============================================================
-- 016: Custom Resource Sections
-- ============================================================

-- Add section_title to cohort_resources for custom grouping on student home
alter table public.cohort_resources
  add column if not exists section_title text;
