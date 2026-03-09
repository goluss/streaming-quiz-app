-- ============================================================
-- 020: Remove Quiz Code Requirement
-- ============================================================

-- 1. Make code nullable
alter table public.tests
  alter column code drop not null;

-- 2. (Optional) Remove unique constraint if we want to allow multiple nulls or just stop using it
-- PostgREST/Postgres allows multiple NULLs in a UNIQUE column, so this is fine.
