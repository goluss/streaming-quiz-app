import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import TestsClient from '@/components/admin/TestsClient'

export const metadata = { title: 'Manage Quizzes | Admin' }

export default async function TestsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') redirect('/student')

  // Fetch active tests
  const { data: tests } = await supabase
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
    .order('created_at', { ascending: false })

  // Fetch transcripts for the creation dropdown
  const { data: transcripts } = await supabase
    .from('transcripts')
    .select('id, title')
    .order('created_at', { ascending: false })

  // Fetch true cohorts from schema
  const { data: cohorts } = await supabase
    .from('cohorts')
    .select('id, name')
    .order('name', { ascending: true })

  // Fetch all questions for manual selection
  const { data: allQuestions } = await supabase
    .from('questions')
    .select('id, question_text, transcript_id')
    .order('created_at', { ascending: false })

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Quiz Assignments</h1>
        <p className="text-slate-500 mt-2 font-medium">Create assessment codes to share with students.</p>
      </div>

      <TestsClient 
        tests={tests ?? []} 
        transcripts={transcripts ?? []} 
        cohorts={cohorts ?? []} 
        allQuestions={allQuestions ?? []}
      />
    </div>
  )
}
