'use server'

import { createClient } from '@supabase/supabase-js'

export async function joinCohortSecurely(userId: string, targetCohortId: string) {
  // Use service role key to securely bypass RLS and insert into student_cohorts junction table
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { error } = await supabaseAdmin
    .from('student_cohorts')
    .upsert(
      {
        user_id: userId,
        cohort_id: targetCohortId
      },
      { onConflict: 'user_id,cohort_id' }
    )

  if (error) {
    throw new Error('Failed to join cohort: ' + error.message)
  }
}
