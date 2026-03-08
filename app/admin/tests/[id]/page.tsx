import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import TestDetailClient from '@/components/admin/TestDetailClient'

export const metadata = { title: 'Quiz Analytics | Admin' }

export default async function TestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  if (profile?.role !== 'admin') redirect('/student')

  const { id } = await params

  // Fetch the test
  const { data: test } = await supabase
    .from('tests')
    .select('id, name, code, created_at, transcripts(title), cohorts(name)')
    .eq('id', id)
    .single()

  if (!test) redirect('/admin/tests')

  // Fetch all attempts for this test, joined with student profile
  const { data: rawAttempts } = await supabase
    .from('test_attempts')
    .select('id, score, correct_count, total_questions, created_at, answers_provided, user_id, profiles(full_name, email)')
    .eq('test_id', id)
    .order('created_at', { ascending: false })

  // Fetch explicitly assigned questions for this test
  const { data: assignedLinks } = await supabase
    .from('test_questions')
    .select('question_id, questions(id, question_text)')
    .eq('test_id', id)

  // Build the student attempts for the client
  const attempts = (rawAttempts ?? []).map(a => {
    const p = Array.isArray(a.profiles) ? a.profiles[0] : a.profiles
    return {
      id: a.id,
      score: a.score,
      correct_count: a.correct_count,
      total_questions: a.total_questions,
      created_at: a.created_at,
      student_name: (p as { full_name?: string | null } | null)?.full_name ?? null,
      student_email: (p as { email?: string | null } | null)?.email ?? null,
    }
  })

  // Build question stat aggregation from answers_provided JSONB
  // answers_provided format: [{ question_id, chosen_answer, correct_answer, is_correct }]
  const questionCountsMap: Record<string, { correct: number; incorrect: number }> = {}

  for (const attempt of rawAttempts ?? []) {
    const answers = (attempt.answers_provided ?? []) as {
      question_id: string
      is_correct: boolean
    }[]
    for (const ans of answers) {
      if (!questionCountsMap[ans.question_id]) {
        questionCountsMap[ans.question_id] = { correct: 0, incorrect: 0 }
      }
      if (ans.is_correct) {
        questionCountsMap[ans.question_id].correct++
      } else {
        questionCountsMap[ans.question_id].incorrect++
      }
    }
  }

  // Build the question stats list — prefer assigned questions, then fall back to what appeared in answers
  type AssignedQ = { question_id: string; questions: { id: string; question_text: string } | null }
  const assignedQs = (assignedLinks ?? []) as unknown as AssignedQ[]

  let questionStats: {
    question_id: string
    question_text: string
    correct: number
    incorrect: number
    total: number
  }[]

  if (assignedQs.length > 0) {
    questionStats = assignedQs
      .filter(l => l.questions)
      .map(l => {
        const stats = questionCountsMap[l.question_id] ?? { correct: 0, incorrect: 0 }
        return {
          question_id: l.question_id,
          question_text: l.questions!.question_text,
          correct: stats.correct,
          incorrect: stats.incorrect,
          total: stats.correct + stats.incorrect,
        }
      })
  } else {
    // Fall back to questions that appeared in answers (no explicit assignment)
    questionStats = Object.entries(questionCountsMap).map(([qid, stats]) => ({
      question_id: qid,
      question_text: qid, // We don't have text, show id — acceptable fallback
      correct: stats.correct,
      incorrect: stats.incorrect,
      total: stats.correct + stats.incorrect,
    }))
  }

  return (
    <TestDetailClient
      test={test as unknown as Parameters<typeof TestDetailClient>[0]['test']}
      attempts={attempts}
      questionStats={questionStats}
    />
  )
}
