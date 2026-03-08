import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import CohortDetailClient from '@/components/admin/CohortDetailClient'
import Link from 'next/link'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'

export const metadata = { title: 'Cohort Details | Admin' }

export default async function CohortDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') redirect('/student')

  const { data: cohort } = await supabase
    .from('cohorts')
    .select('*')
    .eq('id', id)
    .single()

  if (!cohort) redirect('/admin/cohorts')

  // Fetch sessions, transcripts, global resources, and students
  const [{ data: initialSessions }, { data: transcripts }, { data: globalResources }, { data: students }] = await Promise.all([
    supabase
      .from('cohort_sessions')
      .select('id, title, description, created_at')
      .eq('cohort_id', id)
      .order('created_at', { ascending: true }),
    supabase
      .from('transcripts')
      .select('id, title')
      .order('title', { ascending: true }),
    supabase
      .from('global_resources')
      .select('*')
      .order('title', { ascending: true }),
    supabase
      .from('profiles')
      .select('id, full_name, email, created_at')
      .eq('cohort_id', id)
      .eq('role', 'student')
      .order('full_name', { ascending: true }),
  ])

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <Link href="/admin/cohorts" className="inline-flex items-center text-sm font-semibold text-[#003B71] hover:text-indigo-600 mb-4 transition-colors">
          <ArrowLeftIcon className="w-4 h-4 mr-1 stroke-[3]" />
          Back to Cohorts
        </Link>
      </div>

      <CohortDetailClient
        cohort={cohort}
        initialSessions={initialSessions ?? []}
        transcripts={transcripts ?? []}
        globalResources={globalResources ?? []}
        students={students ?? []}
      />
    </div>
  )
}
