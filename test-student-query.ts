import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || '')

async function run() {
  const { data: users } = await supabase.from('profiles').select('id, full_name').limit(1)
  if (!users || users.length === 0) return console.log('No users', await supabase.from('profiles').select('*'))
  
  const user = users[0]
  console.log('Testing for user:', user.full_name, user.id)

  const { data, error } = await supabase
      .from('test_attempts')
      .select(`
        id, score, correct_count, total_questions, created_at, answers_provided, test_id,
        transcripts ( title ),
        tests ( name, cohort_id, cohorts ( name ) )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      
  console.log('Attempts:', data?.length)
  console.log('Error:', error)
}
run()
