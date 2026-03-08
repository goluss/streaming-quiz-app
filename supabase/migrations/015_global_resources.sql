-- ============================================================
-- 015: Global Resource Library
-- ============================================================

-- Create public.global_resources table
create table if not exists public.global_resources (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  url text not null,
  type text not null check (type in ('link', 'document', 'video')),
  file_path text,
  created_at timestamptz not null default now()
);

-- Enable RLS
alter table public.global_resources enable row level security;

-- Admins: Full Access
drop policy if exists "global_resources: admin all" on public.global_resources;
create policy "global_resources: admin all" on public.global_resources
  for all
  using (exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = 'admin'))
  with check (exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = 'admin'));

-- --- STORAGE ---
insert into storage.buckets (id, name, public)
values ('global_resources', 'global_resources', true)
on conflict (id) do nothing;

-- Storage Policies
create policy "Admins can upload global resources"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'global_resources' AND
  exists (
    select 1 from profiles
    where id = auth.uid() and role = 'admin'
  )
);

create policy "Admins can update global resources"
on storage.objects for update
to authenticated
using (
  bucket_id = 'global_resources' AND
  exists (
    select 1 from profiles
    where id = auth.uid() and role = 'admin'
  )
);

create policy "Admins can delete global resources"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'global_resources' AND
  exists (
    select 1 from profiles
    where id = auth.uid() and role = 'admin'
  )
);

create policy "Public can view global resources"
on storage.objects for select
using ( bucket_id = 'global_resources' );
