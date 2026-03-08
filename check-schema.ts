import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || ''
)

async function check() {
  console.log('--- Checking Schema ---')
  const { data, error } = await supabase
    .from('questions')
    .select('is_practice')
    .limit(1)

  if (error) {
    console.error('Error fetching is_practice:', error.message)
    if (error.message.includes('column "is_practice" does not exist')) {
        console.log('Result: COLUMN MISSING')
    } else {
        console.log('Result: UNKNOWN ERROR', error)
    }
  } else {
    console.log('Result: COLUMN EXISTS', data)
  }
}

check()
