import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ResourceLibraryClient from '@/components/admin/ResourceLibraryClient'

export const metadata = { title: 'Resource Library | Admin' }

export default async function ResourceLibraryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch Transcripts with Question counts
  const { data: transcripts } = await supabase
    .from('transcripts')
    .select(`
      id, 
      title, 
      created_at,
      questions (id, is_test, is_practice)
    `)
    .order('created_at', { ascending: false })

  // Fetch Global Resources (Docs/Links)
  const { data: globalResources } = await supabase
    .from('global_resources')
    .select('*')
    .order('created_at', { ascending: false })

  // Fetch Cohorts and their Sessions for assignment
  const { data: cohorts } = await supabase
    .from('cohorts')
    .select(`
      id, 
      name,
      cohort_sessions (id, title)
    `)
    .order('name', { ascending: true })

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Resource Library</h1>
        <p className="text-slate-500 mt-2 font-medium">Manage your questions, documents, and assign them to cohorts.</p>
      </div>

      <ResourceLibraryClient 
        initialTranscripts={transcripts || []} 
        initialGlobalResources={globalResources || []}
        cohorts={cohorts || []} 
      />
    </div>
  )
}
