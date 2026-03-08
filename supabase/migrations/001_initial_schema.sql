-- ============================================================
-- Training Assessment Portal – Initial Schema
-- Run this in the Supabase SQL Editor
-- ============================================================

-- Enable UUID generation
create extension if not exists "pgcrypto";

-- ============================================================
-- profiles
-- Auto-created on first sign-in via trigger below
-- ============================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  avatar_url text,
  role text not null default 'student' check (role in ('admin', 'student')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Trigger: auto-create profile on new auth.users row
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- transcripts
-- ============================================================
create table if not exists public.transcripts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text not null,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- questions
-- options JSONB structure: [{"label": "A", "text": "..."}, ...]
-- correct_answer: "A" | "B" | "C" | "D"
-- ============================================================
create table if not exists public.questions (
  id uuid primary key default gen_random_uuid(),
  transcript_id uuid references public.transcripts(id) on delete cascade,
  question_text text not null,
  options jsonb not null,
  correct_answer text not null check (correct_answer in ('A', 'B', 'C', 'D')),
  category text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- test_attempts
-- answers_provided JSONB: [{question_id, chosen_answer, correct_answer, is_correct}]
-- ============================================================
create table if not exists public.test_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  transcript_id uuid references public.transcripts(id) on delete set null,
  score numeric(5,2) not null default 0,        -- percentage 0–100
  total_questions int not null default 0,
  correct_count int not null default 0,
  answers_provided jsonb not null default '[]',
  email_sent boolean not null default false,
  created_at timestamptz not null default now()
);

-- ============================================================
-- Row-Level Security
-- ============================================================

alter table public.profiles enable row level security;
alter table public.transcripts enable row level security;
alter table public.questions enable row level security;
alter table public.test_attempts enable row level security;

-- Helper: is the current user an admin?
create or replace function public.is_admin()
returns boolean
language sql
security definer
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- profiles: users can read own profile; admins can read all
create policy "profiles: own read" on public.profiles
  for select using (id = auth.uid() or is_admin());

create policy "profiles: own update" on public.profiles
  for update using (id = auth.uid() or is_admin());

-- transcripts: admins full-access; students read-only
create policy "transcripts: admin all" on public.transcripts
  for all using (is_admin());

create policy "transcripts: student read" on public.transcripts
  for select using (auth.uid() is not null);

-- questions: admins full-access; students read-only
create policy "questions: admin all" on public.questions
  for all using (is_admin());

create policy "questions: student read" on public.questions
  for select using (auth.uid() is not null);

-- test_attempts: users see own; admins see all
create policy "attempts: own read" on public.test_attempts
  for select using (user_id = auth.uid() or is_admin());

create policy "attempts: own insert" on public.test_attempts
  for insert with check (user_id = auth.uid());

create policy "attempts: admin update" on public.test_attempts
  for update using (is_admin());

-- ============================================================
-- Indexes
-- ============================================================
create index if not exists idx_questions_transcript on public.questions(transcript_id);
create index if not exists idx_attempts_user on public.test_attempts(user_id);
create index if not exists idx_attempts_created on public.test_attempts(created_at desc);
