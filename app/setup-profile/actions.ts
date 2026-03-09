'use server'

import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

export async function joinCohortSecurely(userId: string, targetCohortId?: string | null, inviteCode?: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Use service role key to securely bypass RLS and insert into student_cohorts junction table
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    let finalCohortId = targetCohortId

    // If an invite code was provided, look up the cohort ID
    if (inviteCode) {
      const { data: cohort, error: cohortError } = await supabaseAdmin
        .from('cohorts')
        .select('id')
        .eq('invite_code', inviteCode.trim().toUpperCase())
        .single()

      if (cohortError || !cohort) {
        return { success: false, error: 'Invalid Cohort Invite Code. Please check the code and try again.' }
      }
      finalCohortId = cohort.id
    }

    if (!finalCohortId) {
      return { success: true } // Nothing to join
    }

    // Upsert the membership
    const { error } = await supabaseAdmin
      .from('student_cohorts')
      .upsert(
        {
          user_id: userId,
          cohort_id: finalCohortId
        },
        { onConflict: 'user_id,cohort_id' }
      )

    if (error) {
      return { success: false, error: 'Failed to join cohort: ' + error.message }
    }

    // Set the active cohort cookie
    const cookieStore = await cookies()
    cookieStore.set('active_cohort_id', finalCohortId, {
      path: '/',
      httpOnly: false,
      maxAge: 60 * 60 * 24 * 30, // 30 days
      sameSite: 'lax',
    })

    return { success: true }
  } catch (err: any) {
    console.error("Critical error in joinCohortSecurely:", err)
    return { success: false, error: 'An unexpected error occurred. Please try again.' }
  }
}

