-- ============================================================
-- Phase 7: Cohort Invites
-- ============================================================

-- Add a unique invite_code column to cohorts
alter table public.cohorts
  add column if not exists invite_code varchar(6) unique;

-- Create extension for pgcrypto if it isn't already there (it should be)
create extension if not exists "pgcrypto";

-- Function to generate a random 6-character uppercase alphanumeric code
create or replace function public.generate_cohort_code()
returns varchar
language plpgsql
as $$
declare
  chars text := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  result text := '';
  i integer := 0;
begin
  for i in 1..6 loop
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  end loop;
  return result;
end;
$$;

-- Populate existing cohorts with a code
update public.cohorts
set invite_code = public.generate_cohort_code()
where invite_code is null;

-- Make it NOT NULL after populating
alter table public.cohorts
  alter column invite_code set not null;
