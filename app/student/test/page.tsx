import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import TestClient from '@/components/student/TestClient'

export const metadata = { title: 'Take Assessment | Training Portal' }

export default async function TestPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const resolvedParams = await searchParams
  const codeParam = resolvedParams.code

  const code = typeof codeParam === 'string' ? codeParam.toUpperCase() : null
  if (!code || code.length !== 6) {
    return <div className="p-8 text-center text-red-400">Error: Invalid or missing quiz code in URL.</div>
  }

  // Fetch the test and profile
  const [{ data: profile }, { data: test, error: testError }] = await Promise.all([
    supabase.from('profiles').select('full_name').eq('id', user.id).single(),
    supabase.from('tests').select('id, transcript_id, name').eq('code', code).eq('is_active', true).single(),
  ])

  if (!test) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl text-red-400 font-bold mb-2">Quiz Not Found</h2>
        <p className="text-slate-400 mb-4">Code {code} is invalid or inactive.</p>
        <p className="text-xs text-slate-500 max-w-md mx-auto">{testError?.message}</p>
      </div>
    )
  }

  type Question = { id: string; transcript_id: string; question_text: string; options: { label: string; text: string }[]; correct_answer: string }

  // First, check for explicitly assigned questions for this test
  const { data: assignedLinks } = await supabase
    .from('test_questions')
    .select('questions(id, transcript_id, question_text, options, correct_answer)')
    .eq('test_id', test.id)

  let questions: Question[] = []
  let usingAssigned = false

  if (assignedLinks && assignedLinks.length > 0) {
    questions = assignedLinks.flatMap(link => {
      const q = link.questions as unknown as Question | null
      return q ? [q] : []
    })
    usingAssigned = true
  } else {
    // Fall back: pull all transcript questions
    const { data: transcriptQs, error: qError } = await supabase
      .from('questions')
      .select('id, transcript_id, question_text, options, correct_answer')
      .eq('transcript_id', test.transcript_id)
      .eq('is_practice', false)

    if (!transcriptQs || transcriptQs.length < 5) {
      return (
        <div className="p-8 text-center">
          <h2 className="text-xl text-red-400 font-bold mb-2">Not Enough Questions</h2>
          <p className="text-slate-400">This quiz requires at least 5 questions, but the transcript only has {transcriptQs?.length ?? 0}.</p>
          <p className="text-xs text-slate-500 mt-2">{qError?.message}</p>
        </div>
      )
    }

    questions = transcriptQs as Question[]
  }

  const questionCount = questions.length

  return (
    <div>
      <div className="mb-0">
        <h1 className="text-3xl font-extrabold text-[#003B71] tracking-tight">{test.name}</h1>
        <p className="text-slate-500 mt-2 font-medium">
          Answer the following 5 questions to complete your assessment.
        </p>
      </div>
      <TestClient
        questions={questions as Parameters<typeof TestClient>[0]['questions']}
        testId={test.id}
        transcriptId={test.transcript_id}
        user={{ id: user.id, email: user.email!, name: profile?.full_name }}
        fixedCount={5}
      />
    </div>
  )
}
