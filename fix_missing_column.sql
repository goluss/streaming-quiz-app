-- Run this in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/mqayxojkhnvmmlodhmzb/sql/new

ALTER TABLE public.questions
ADD COLUMN IF NOT EXISTS is_practice BOOLEAN DEFAULT false NOT NULL;

-- Verify it worked
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'questions' AND column_name = 'is_practice';
