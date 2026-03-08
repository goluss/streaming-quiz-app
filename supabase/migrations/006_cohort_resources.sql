-- ============================================================
-- Phase 9: Cohort Resources
-- ============================================================

create table public.cohort_resources (
  id uuid default gen_random_uuid() primary key,
  cohort_id uuid references public.cohorts on delete cascade not null,
  title text not null,
  url text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.cohort_resources enable row level security;

-- Admins can do everything
create policy "Admins can manage cohort resources"
  on public.cohort_resources for all
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role = 'admin'
    )
  );

-- Students can view resources assigned to their cohort
create policy "Students can view assigned cohort resources"
  on public.cohort_resources for select
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.cohort_id = cohort_resources.cohort_id
    )
  );
