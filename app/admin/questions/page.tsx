import { createClient } from '@/lib/supabase/server'
import QuestionsClient from '@/components/admin/QuestionsClient'

export const metadata = { title: 'Question Bank – Admin | Training Portal' }

export default async function QuestionsPage() {
  const supabase = await createClient()
  const [{ data: questions }, { data: tests }, { data: transcripts }] = await Promise.all([
    supabase
      .from('questions')
      .select('id, transcript_id, question_text, options, correct_answer, category, is_practice, transcripts(title)')
      .order('created_at', { ascending: false }),
    supabase
      .from('tests')
      .select('id, name')
      .order('created_at', { ascending: false }),
    supabase
      .from('transcripts')
      .select('id, title')
      .order('title', { ascending: true })
  ])

  return <QuestionsClient questions={questions ?? []} tests={tests ?? []} transcripts={transcripts ?? []} />
}
