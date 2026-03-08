-- Update cohort_resources table to support file uploads
alter table cohort_resources add column type text default 'link' check (type in ('link', 'document', 'video'));
alter table cohort_resources add column file_path text;

-- Create storage bucket for resources (if not exists via SQL)
-- Note: Some Supabase environments require manual bucket creation in the dashboard,
-- but we can try to insert it into the storage.buckets table.
insert into storage.buckets (id, name, public)
values ('resources', 'resources', true)
on conflict (id) do nothing;

-- Storage Policies for 'resources' bucket
-- Allow admins to do everything
create policy "Admins can upload resources"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'resources' AND
  exists (
    select 1 from profiles
    where id = auth.uid() and role = 'admin'
  )
);

create policy "Admins can update resources"
on storage.objects for update
to authenticated
using (
  bucket_id = 'resources' AND
  exists (
    select 1 from profiles
    where id = auth.uid() and role = 'admin'
  )
);

create policy "Admins can delete resources"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'resources' AND
  exists (
    select 1 from profiles
    where id = auth.uid() and role = 'admin'
  )
);

-- Allow students in the cohort to read resources
-- This is a bit tricky as bucket policies don't easily join on app tables without complexity.
-- For simplicity in this training portal, we'll allow all authenticated users to read.
create policy "Authenticated users can view resources"
on storage.objects for select
to authenticated
using ( bucket_id = 'resources' );
