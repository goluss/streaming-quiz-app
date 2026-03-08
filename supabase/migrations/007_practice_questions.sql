-- ============================================================
-- Phase 9: Practice Questions
-- ============================================================

-- Add is_practice column to questions table
alter table public.questions
  add column if not exists is_practice boolean default false not null;
