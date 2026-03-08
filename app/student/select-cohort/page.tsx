import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { setActiveCohort } from './actions'
import AutoSelectCohort from './AutoSelectCohort'

export const metadata = { title: 'Select Cohort | Training Portal' }

export default async function SelectCohortPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch all cohorts this student belongs to
  const { data: memberships } = await supabase
    .from('student_cohorts')
    .select('cohort_id, cohorts(id, name)')
    .eq('user_id', user.id)

  const cohorts = (memberships ?? [])
    .map(m => {
      const c = Array.isArray(m.cohorts) ? m.cohorts[0] : m.cohorts
      return c ? { id: c.id, name: c.name } : null
    })
    .filter(Boolean) as { id: string; name: string }[]

  // If only one cohort, auto-select it using a client component
  if (cohorts.length === 1) {
    return <AutoSelectCohort cohortId={cohorts[0].id} />
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-xl">
        {/* Logo/Header */}
        <div className="text-center mb-10">
          <div className="inline-flex flex-col items-center">
            <span className="text-2xl font-extrabold text-[#003B71] tracking-tight">Training Portal</span>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Steven Golus</span>
          </div>
        </div>

        {cohorts.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center shadow-sm">
            <div className="w-14 h-14 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-amber-100">
              <svg className="w-7 h-7 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-slate-900 mb-2">No Cohort Assigned</h1>
            <p className="text-slate-500 text-sm leading-relaxed">
              You haven't been added to any training cohort yet. Please contact your administrator.
            </p>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Choose your cohort</h1>
              <p className="text-slate-500 font-medium mt-1 text-sm">Select the training group you'd like to view today.</p>
            </div>
            <div className="space-y-3">
              {cohorts.map((cohort) => (
                <form key={cohort.id} action={setActiveCohort.bind(null, cohort.id)}>
                  <button
                    type="submit"
                    className="w-full group flex items-center justify-between bg-white hover:bg-[#003B71] border border-slate-200 hover:border-[#003B71] rounded-2xl px-6 py-5 text-left transition-all shadow-sm hover:shadow-md active:scale-[0.99]"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-[#003B71]/10 group-hover:bg-white/10 flex items-center justify-center transition-colors shrink-0">
                        <svg className="w-5 h-5 text-[#003B71] group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 group-hover:text-white transition-colors">{cohort.name}</p>
                        <p className="text-xs text-slate-400 group-hover:text-white/60 transition-colors font-medium">Training Cohort</p>
                      </div>
                    </div>
                    <svg className="w-5 h-5 text-slate-300 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </form>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
