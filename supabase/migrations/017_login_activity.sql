-- ============================================================
-- 017: Login Activity Tracking
-- ============================================================

create table if not exists public.login_activity (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete cascade,
  user_email  text,
  ip_address  text,
  user_agent  text,
  created_at  timestamptz not null default now()
);

-- Enable RLS
alter table public.login_activity enable row level security;

-- Admins can read all activity
create policy "Admins can view all login activity" on public.login_activity
  for select
  using (exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = 'admin'));

-- Users can read their own activity (optional, for transparency)
create policy "Users can view their own login activity" on public.login_activity
  for select
  using (user_id = auth.uid());

-- Index for performance
create index if not exists idx_login_activity_user on public.login_activity(user_id);
create index if not exists idx_login_activity_created on public.login_activity(created_at desc);
活跃状态: <span className="text-[#003B71]">{tests.length}</span>
