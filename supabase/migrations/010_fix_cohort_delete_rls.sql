-- Fix cohorts RLS for delete
drop policy if exists "cohorts: admin all" on public.cohorts;
create policy "cohorts: admin all" on public.cohorts
  for all using (is_admin())
  with check (is_admin());
