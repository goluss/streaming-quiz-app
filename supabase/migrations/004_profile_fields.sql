-- ============================================================
-- Phase 6: Auth Enhancements & User Profiles
-- ============================================================

-- Add new columns for mandatory onboarding
alter table public.profiles
  add column if not exists first_name text,
  add column if not exists last_name text,
  add column if not exists company text,
  add column if not exists company_email text;
