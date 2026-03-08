-- ============================================================
-- Phase 9: Cohort Resources (006)
-- ============================================================
create table if not exists public.cohort_resources (
  id uuid default gen_random_uuid() primary key,
  cohort_id uuid references public.cohorts on delete cascade not null,
  title text not null,
  url text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.cohort_resources enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where policyname = 'Admins can manage cohort resources' and tablename = 'cohort_resources') then
    create policy "Admins can manage cohort resources"
      on public.cohort_resources for all
      using (
        exists (
          select 1 from profiles
          where profiles.id = auth.uid()
          and profiles.role = 'admin'
        )
      );
  end if;
  
  if not exists (select 1 from pg_policies where policyname = 'Students can view assigned cohort resources' and tablename = 'cohort_resources') then
    create policy "Students can view assigned cohort resources"
      on public.cohort_resources for select
      using (
        exists (
          select 1 from profiles
          where profiles.id = auth.uid()
          and profiles.cohort_id = cohort_resources.cohort_id
        )
      );
  end if;
end $$;


-- ============================================================
-- Phase 9: Practice Questions (007)
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='questions' AND column_name='is_practice'
  ) THEN
    ALTER TABLE public.questions ADD COLUMN is_practice boolean default false not null;
  END IF;
END $$;


-- ============================================================
-- Fix Cohort Invite Generation (009)
-- ============================================================
alter table public.cohorts 
  alter column invite_code set default public.generate_cohort_code();


-- ============================================================
-- Fix cohorts RLS for delete (010)
-- ============================================================
drop policy if exists "cohorts: admin all" on public.cohorts;
create policy "cohorts: admin all" on public.cohorts
  for all using (is_admin())
  with check (is_admin());


-- ============================================================
-- Resource Uploads (008)
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='cohort_resources' AND column_name='type'
  ) THEN
    ALTER TABLE cohort_resources ADD COLUMN type text default 'link' check (type in ('link', 'document', 'video'));
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='cohort_resources' AND column_name='file_path'
  ) THEN
    ALTER TABLE cohort_resources ADD COLUMN file_path text;
  END IF;
END $$;

insert into storage.buckets (id, name, public)
values ('resources', 'resources', true)
on conflict (id) do nothing;

do $$
begin
  if not exists (select 1 from pg_policies where policyname = 'Admins can upload resources' and tablename = 'objects' and schemaname = 'storage') then
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
  end if;

  if not exists (select 1 from pg_policies where policyname = 'Admins can update resources' and tablename = 'objects' and schemaname = 'storage') then
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
  end if;

  if not exists (select 1 from pg_policies where policyname = 'Admins can delete resources' and tablename = 'objects' and schemaname = 'storage') then
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
  end if;

  if not exists (select 1 from pg_policies where policyname = 'Authenticated users can view resources' and tablename = 'objects' and schemaname = 'storage') then
    create policy "Authenticated users can view resources"
    on storage.objects for select
    to authenticated
    using ( bucket_id = 'resources' );
  end if;
end $$;

-- ============================================================
-- Test Questions table (008_test_questions)
-- ============================================================
CREATE TABLE IF NOT EXISTS test_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    test_id UUID NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(test_id, question_id)
    -- Ignore conflicts if already exists
);

ALTER TABLE test_questions ENABLE ROW LEVEL SECURITY;

do $$
begin
  if not exists (select 1 from pg_policies where policyname = 'Admins can manage test_questions' and tablename = 'test_questions') then
    CREATE POLICY "Admins can manage test_questions" ON test_questions
        FOR ALL TO authenticated
        USING (
            EXISTS (
                SELECT 1 FROM profiles 
                WHERE profiles.id = auth.uid() 
                AND profiles.role = 'admin'
            )
        )
        WITH CHECK (
            EXISTS (
                SELECT 1 FROM profiles 
                WHERE profiles.id = auth.uid() 
                AND profiles.role = 'admin'
            )
        );
  end if;

  if not exists (select 1 from pg_policies where policyname = 'Students can view test_questions' and tablename = 'test_questions') then
    CREATE POLICY "Students can view test_questions" ON test_questions
        FOR SELECT TO authenticated
        USING (true);
  end if;
end $$;

