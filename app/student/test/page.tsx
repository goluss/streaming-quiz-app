import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import Link from 'next/link'
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

  const cookieStore = await cookies()
  const activeCohortId = cookieStore.get('active_cohort_id')?.value || null

  const resolvedParams = await searchParams
  const codeParam = resolvedParams.code
  const idParam = resolvedParams.id

  const code = typeof codeParam === 'string' ? codeParam.toUpperCase() : null
  const testId = typeof idParam === 'string' ? idParam : null

  if (!code && !testId) {
    return <div className="p-8 text-center text-red-400">Error: Missing quiz identification (ID or Code).</div>
  }

  // Fetch the test and profile
  let query = supabase.from('tests').select('id, transcript_id, name').eq('is_active', true)
  
  if (testId) {
    query = query.eq('id', testId)
  } else {
    query = query.eq('code', code!)
  }

  const [{ data: profile }, { data: test, error: testError }] = await Promise.all([
    supabase.from('profiles').select('full_name').eq('id', user.id).single(),
    query.single(),
  ])

  if (!test) {
    return (
      <div className="p-8 text-center bg-white border border-slate-200 rounded-3xl shadow-sm max-w-2xl mx-auto my-12">
        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
          </svg>
        </div>
        <h2 className="text-2xl font-extrabold text-slate-900 mb-2">Quiz Not Available</h2>
        <p className="text-slate-500 mb-8 font-medium">
          The quiz you are looking for is either inactive or does not exist.
        </p>
        <Link href="/student" className="inline-flex items-center gap-2 px-6 py-3 bg-[#003B71] text-white font-bold rounded-xl hover:bg-[#00264d] transition-all shadow-lg shadow-[#003B71]/20">
          Back to Dashboard
        </Link>
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
  } else if (test.transcript_id) {
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
  } else {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl text-red-400 font-bold mb-2">No Questions Assigned</h2>
        <p className="text-slate-400">This standalone quiz does not have any questions assigned to it.</p>
      </div>
    )
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
        cohortId={activeCohortId}
        user={{ id: user.id, email: user.email!, name: profile?.full_name }}
        fixedCount={5}
      />
    </div>
  )
}
