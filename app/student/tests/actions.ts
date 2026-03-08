'use server'

import { createClient } from '@/lib/supabase/server'

export async function verifyTestCode(code: string) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Unauthorized.' }
    }

    const cleanCode = code.trim().toUpperCase()

    const { data: test, error } = await supabase
      .from('tests')
      .select('id, name')
      .eq('code', cleanCode)
      .eq('is_active', true)
      .single()

    if (error || !test) {
      return { success: false, error: error?.message || 'Quiz not found or inactive.' }
    }

    return { success: true, testId: test.id, name: test.name }
  } catch (err: any) {
    console.error('Test code verification error:', err)
    return { success: false, error: 'An unexpected server error occurred.' }
  }
}

export async function submitTestAttempt(payload: {
  testId: string
  transcriptId: string | null
  score: number
  totalQuestions: number
  correctCount: number
  answers: any[]
}) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Unauthorized user.' }
    }

    const { data: attempt, error } = await supabase
      .from('test_attempts')
      .insert({
        user_id: user.id,
        test_id: payload.testId,
        transcript_id: payload.transcriptId,
        score: payload.score,
        total_questions: payload.totalQuestions,
        correct_count: payload.correctCount,
        answers_provided: payload.answers,
      })
      .select('id')
      .single()

    if (error || !attempt) {
      console.error('Database insertion error:', error)
      return { success: false, error: error?.message || 'Failed to save test attempt to the database.' }
    }

    return { success: true, attemptId: attempt.id }
  } catch (err: any) {
    console.error('Test submission error:', err)
    return { success: false, error: 'An unexpected server error occurred during submission.' }
  }
}
