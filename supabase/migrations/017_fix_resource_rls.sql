-- Fix RLS policy for cohort_resources to ensure with check is present
drop policy if exists "Admins can manage cohort resources" on public.cohort_resources;

create policy "Admins can manage cohort resources"
  on public.cohort_resources for all
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role = 'admin'
    )
  );
