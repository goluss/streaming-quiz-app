import { createClient } from '@/lib/supabase/server'
import TranscriptsClient from '@/components/admin/TranscriptsClient'

export const metadata = { title: 'Transcripts – Admin | Training Assessment Portal' }

export default async function TranscriptsPage() {
  const supabase = await createClient()
  const { data: transcripts } = await supabase
    .from('transcripts')
    .select('id, title, content, created_at')
    .order('created_at', { ascending: false })

  return <TranscriptsClient transcripts={transcripts ?? []} />
}
