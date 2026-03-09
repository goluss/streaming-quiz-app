'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// Generate random 6-character alphanumeric code
function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

export async function createQuizSecurely(name: string, cohortId: string, selectedQuestionIds: string[]) {
  const supabase = await createClient()

  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    const code = generateCode()

    const { data: test, error: testError } = await supabase
      .from('tests')
      .insert({
        name: name.trim(),
        code,
        cohort_id: cohortId || null,
        created_by: user?.id
      })
      .select()
      .single()

    if (testError) {
      console.error("Test Creation Error:", testError)
      return { success: false, error: testError.message || 'Failed to insert test record.' }
    }

    const questionLinks = selectedQuestionIds.map(qid => ({
      test_id: test.id,
      question_id: qid
    }))

    const { error: linkError } = await supabase
      .from('test_questions')
      .insert(questionLinks)

    if (linkError) {
      console.error("Test Questions Link Error:", linkError)
      return { success: false, error: linkError.message || 'Failed to link questions.' }
    }

    const { data: fullTest, error: fetchError } = await supabase
      .from('tests')
      .select(`
        *,
        transcripts ( title ),
        cohorts ( name ),
        test_questions (
          question_id,
          questions ( question_text )
        )
      `)
      .eq('id', test.id)
      .single()

    if (fetchError) {
      console.error("Fetch full test Error:", fetchError)
      return { success: false, error: fetchError.message || 'Quiz created, but failed to fetch data.' }
    }

    revalidatePath('/admin/tests')
    return { success: true, code, test: fullTest }
  } catch (error: any) {
    console.error("Unexpected error in createQuizSecurely:", error)
    return { success: false, error: error.message || 'An unexpected error occurred.' }
  }
}

export async function deleteQuiz(id: string) {
  const supabase = await createClient()

  try {
    const { error } = await supabase
      .from('tests')
      .delete()
      .eq('id', id)

    if (error) {
      console.error("Test Deletion Error:", error)
      return { success: false, error: error.message || 'Failed to delete test.' }
    }

    revalidatePath('/admin/tests')
    return { success: true }
  } catch (error: any) {
    console.error("Unexpected error in deleteQuiz:", error)
    return { success: false, error: error.message || 'An unexpected error occurred.' }
  }
}

export async function deleteTestAttempt(id: string, testId: string) {
  const supabase = await createClient()

  try {
    const { error } = await supabase
      .from('test_attempts')
      .delete()
      .eq('id', id)

    if (error) {
      console.error("Test Attempt Deletion Error:", error)
      return { success: false, error: error.message || 'Failed to delete test attempt.' }
    }

    revalidatePath(`/admin/tests/${testId}`)
    return { success: true }
  } catch (error: any) {
    console.error("Unexpected error in deleteTestAttempt:", error)
    return { success: false, error: error.message || 'An unexpected error occurred.' }
  }
}
