-- Phase 14: Add Whiteboard Link to Cohorts
alter table public.cohorts 
  add column if not exists whiteboard_url text;
