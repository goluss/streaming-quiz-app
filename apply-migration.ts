import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || ''
)

async function runMigration() {
  console.log('--- Running Migration: Add is_practice to questions ---')
  
  // Using direct SQL execution via Supabase RPC if available, or a fallback approach.
  // Since we don't have a generic 'exec' RPC, we'll try to use the REST API to infer if we can add it.
  // Actually, the most reliable way as an agent is to attempt a dummy insert or just provide the clear instruction again.
  // But wait, I can try to use a 'postgres' library if it's installed, or just use the service role key to check if I can 
  // interact with the schema. 

  // Better approach: I'll create a script that uses the service role key to attempt to 
  // insert a row with the column to see if it's truly still missing after my instructions.
  
  const { error } = await supabase.rpc('exec_sql', { 
    sql: "ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS is_practice BOOLEAN DEFAULT false NOT NULL;" 
  })

  if (error) {
    console.error('Migration failed (RPC exec_sql might not exist):', error.message)
    console.log('Please run the SQL manually in the Supabase Dashboard: /Users/stevengolus/.gemini/antigravity/scratch/training-portal/fix_missing_column.sql')
  } else {
    console.log('Migration successful!')
  }
}

runMigration()
