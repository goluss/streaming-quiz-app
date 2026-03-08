import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import CohortsClient from '@/components/admin/CohortsClient'

export const metadata = { title: 'Manage Cohorts | Admin' }

export default async function CohortsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') redirect('/student')

  // Fetch all cohorts and some basic stats
  const { data: cohorts } = await supabase
    .from('cohorts')
    .select(`
      id,
      name,
      invite_code,
      whiteboard_url,
      created_at,
      profiles ( count )
    `)
    .order('created_at', { ascending: false })

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Cohorts</h1>
        <p className="text-slate-500 mt-2 font-medium">Manage student groups, view analytics, and export result records.</p>
      </div>

      <CohortsClient initialCohorts={cohorts ?? []} />
    </div>
  )
}
