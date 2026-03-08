import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import StudentNav from '@/components/student/StudentNav'

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const [{ data: profile }, { data: memberships }] = await Promise.all([
    supabase.from('profiles').select('email, full_name, avatar_url, role').eq('id', user.id).single(),
    supabase.from('student_cohorts').select('cohort_id').eq('user_id', user.id),
  ])

  // Admins don't need a cohort — skip redirection for them
  const isAdmin = profile?.role === 'admin'

  if (!isAdmin) {
    const cookieStore = await cookies()
    const activeCohortId = cookieStore.get('active_cohort_id')?.value
    const cohortIds = (memberships ?? []).map(m => m.cohort_id)

    // If cookie is missing, invalid, or student has no cohorts, redirect to picker
    const cookieValid = activeCohortId && cohortIds.includes(activeCohortId)
    if (!cookieValid) {
      redirect('/student/select-cohort')
    }
  }

  const cohortCount = (memberships ?? []).length

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <StudentNav
        user={{ email: profile?.email ?? user.email ?? '', name: profile?.full_name, avatar: profile?.avatar_url }}
        showSwitchCohort={!isAdmin && cohortCount > 1}
      />
      <main className="max-w-5xl mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  )
}
