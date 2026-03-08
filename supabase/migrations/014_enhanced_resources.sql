-- ============================================================
-- 014: Enhanced Resources & Question Management
-- ============================================================

-- 1. Update public.questions with is_test
alter table public.questions
  add column if not exists is_test boolean default true not null;

-- 2. Update public.cohort_resources for Practice Questions
-- First, drop the old constraint if it exists
alter table public.cohort_resources
  drop constraint if exists cohort_resources_type_check;

-- Add new type including 'practice'
alter table public.cohort_resources
  add constraint cohort_resources_type_check check (type in ('link', 'document', 'video', 'practice'));

-- Add transcript_id for practice-type resources
alter table public.cohort_resources
  add column if not exists transcript_id uuid references public.transcripts(id) on delete set null;

create index if not exists idx_cohort_resources_transcript on public.cohort_resources(transcript_id);

-- 3. RLS Check (Confirming existing policies cover new columns)
-- Admins already have 'all' for questions and cohort_resources.
-- Students have 'select' for both, which will now automatically include new columns.
