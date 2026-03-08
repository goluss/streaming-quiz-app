import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import Link from 'next/link'
import TestCodeEntry from '@/components/student/TestCodeEntry'

export const metadata = { title: 'Dashboard | Training Portal' }

export default async function StudentDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const cookieStore = await cookies()
  const activeCohortId = cookieStore.get('active_cohort_id')?.value
  if (!activeCohortId) redirect('/student/select-cohort')

  const [{ data: profile }, { data: cohort }, { data: sessions }] = await Promise.all([
    supabase.from('profiles').select('full_name').eq('id', user.id).single(),
    supabase.from('cohorts').select('id, name, whiteboard_url').eq('id', activeCohortId).single(),
    supabase
      .from('cohort_sessions')
      .select('id, title, description, created_at, cohort_resources(id)')
      .eq('cohort_id', activeCohortId)
      .order('created_at', { ascending: true })
  ])

  const firstName = profile?.full_name?.split(' ')[0] ?? 'there'

  return (
    <div className="space-y-12 max-w-5xl mx-auto px-6 py-10">
      {/* Greeting */}
      <div>
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Welcome back, {firstName}.</h1>
        <div className="flex flex-col gap-2">
          <p className="text-lg text-slate-500 font-medium">
            Viewing cohort: <span className="text-[#003B71] font-bold">{cohort?.name}</span>
          </p>
          {cohort?.whiteboard_url && (
            <a 
              href={cohort.whiteboard_url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-[#003B71] hover:text-indigo-600 font-black text-xs uppercase tracking-widest transition-colors group"
            >
              <svg className="w-4 h-4 text-slate-400 group-hover:text-[#003B71] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              Link to Whiteboard
            </a>
          )}
        </div>
      </div>


      {/* ── Session Resources ── */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Session Resources</h2>
            <p className="text-sm text-slate-500 font-medium mt-1">
              {sessions && sessions.length > 0
                ? `${sessions.length} session${sessions.length !== 1 ? 's' : ''} available`
                : 'Your instructor will add sessions here'}
            </p>
          </div>
        </div>

        {!sessions || sessions.length === 0 ? (
          <div className="text-center py-16 border-2 border-slate-100 border-dashed rounded-2xl bg-white">
            <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center mx-auto mb-4 border border-slate-100">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-slate-300">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9.776c.112-.017.227-.026.344-.026h15.812c.117 0 .232.009.344.026m-16.5 0a2.25 2.25 0 0 0-1.883 2.542l.857 6a2.25 2.25 0 0 0 2.227 1.932H19.05a2.25 2.25 0 0 0 2.227-1.932l.857-6a2.25 2.25 0 0 0-1.883-2.542m-16.5 0V6A2.25 2.25 0 0 1 6 3.75h3.879a1.5 1.5 0 0 1 1.06.44l2.122 2.12a1.5 1.5 0 0 0 1.06.44H18A2.25 2.25 0 0 1 20.25 9v.776" />
              </svg>
            </div>
            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No sessions yet</p>
            <p className="text-slate-500 text-sm mt-2">Your instructor hasn't created any class sessions yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {sessions.map((session, idx) => {
              const resourceCount = Array.isArray(session.cohort_resources) ? session.cohort_resources.length : 0
              return (
                <Link
                  key={session.id}
                  href={`/student/sessions/${session.id}`}
                  className="group flex flex-col bg-white hover:bg-[#003B71] border border-slate-200 hover:border-[#003B71] rounded-2xl p-6 transition-all shadow-sm hover:shadow-lg active:scale-[0.99]"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-10 h-10 rounded-xl bg-[#003B71]/10 group-hover:bg-white/10 flex items-center justify-center shrink-0 transition-colors">
                      <span className="text-sm font-black text-[#003B71] group-hover:text-white transition-colors">
                        {String(idx + 1).padStart(2, '0')}
                      </span>
                    </div>
                    <svg className="w-5 h-5 text-slate-300 group-hover:text-white/40 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                  <h3 className="font-extrabold text-slate-900 group-hover:text-white text-base leading-snug transition-colors">
                    {session.title}
                  </h3>
                  {session.description && (
                    <p className="text-sm text-slate-500 group-hover:text-white/60 mt-1.5 line-clamp-2 transition-colors">
                      {session.description}
                    </p>
                  )}
                  <div className="mt-4 pt-4 border-t border-slate-100 group-hover:border-white/10 transition-colors">
                    <p className="text-[10px] font-bold text-slate-400 group-hover:text-white/50 uppercase tracking-widest transition-colors">
                      {resourceCount} resource{resourceCount !== 1 ? 's' : ''}
                    </p>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
