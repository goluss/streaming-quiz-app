import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import PracticeClient from '@/components/student/PracticeClient'

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params
  return { title: `Practice Session – Training Portal` }
}

export default async function PracticePage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const cookieStore = await cookies()
  const activeCohortId = cookieStore.get('active_cohort_id')?.value

  // Fetch transcript details
  const { data: transcript } = await supabase
    .from('transcripts')
    .select('title')
    .eq('id', id)
    .single()

  if (!transcript) redirect('/student')

  // Fetch exactly 10 practice questions for this transcript in stable order
  const { data: questions } = await supabase
    .from('questions')
    .select('id, transcript_id, question_text, options, correct_answer, category')
    .eq('transcript_id', id)
    .eq('is_practice', true)
    .order('id', { ascending: true })
    .limit(10)

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8">
      <PracticeClient 
        questions={questions ?? []} 
        transcriptTitle={transcript.title} 
        transcriptId={id}
        cohortId={activeCohortId ?? null}
      />
    </div>
  )
}
