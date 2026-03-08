import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import Link from 'next/link'

export const metadata = { title: 'Class Resources | Training Portal' }

export default async function StudentResourcesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const cookieStore = await cookies()
  const activeCohortId = cookieStore.get('active_cohort_id')?.value

  if (!activeCohortId) {
    redirect('/student/select-cohort')
  }

  const [{ data: resources }, { data: sessions }] = await Promise.all([
    supabase
      .from('cohort_resources')
      .select('*')
      .eq('cohort_id', activeCohortId)
      .order('created_at', { ascending: false }),
    supabase
      .from('cohort_sessions')
      .select('id, title')
      .eq('cohort_id', activeCohortId)
      .order('created_at', { ascending: true })
  ])

  const generalResources = (resources ?? []).filter(r => !r.session_id)
  const sessionMappedResources = (sessions ?? []).map(s => ({
    ...s,
    resources: (resources ?? []).filter(r => r.session_id === s.id)
  })).filter(s => s.resources.length > 0)

  const hasAnyResources = generalResources.length > 0 || sessionMappedResources.length > 0

  return (
    <div className="space-y-12 max-w-5xl mx-auto px-6 py-10">
      <div>
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Class Resources</h1>
        <p className="text-lg text-slate-500 mt-3 font-medium">
          Study materials and session recordings for your active cohort.
        </p>
      </div>

      {!hasAnyResources ? (
        <div className="text-center py-20 border-2 border-slate-100 border-dashed rounded-2xl bg-white shadow-sm">
          <div className="w-12 h-12 bg-slate-50 text-slate-300 rounded-xl flex items-center justify-center mx-auto mb-4 border border-slate-100">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9.776c.112-.017.227-.026.344-.026h15.812c.117 0 .232.009.344.026m-16.5 0a2.25 2.25 0 0 0-1.883 2.542l.857 6a2.25 2.25 0 0 0 2.227 1.932H19.05a2.25 2.25 0 0 0 2.227-1.932l.857-6a2.25 2.25 0 0 0-1.883-2.542m-16.5 0V6A2.25 2.25 0 0 1 6 3.75h3.879a1.5 1.5 0 0 1 1.06.44l2.122 2.12a1.5 1.5 0 0 0 1.06.44H18A2.25 2.25 0 0 1 20.25 9v.776" />
            </svg>
          </div>
          <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No resources</p>
          <p className="text-slate-500 text-sm mt-2">Your instructor hasn't uploaded any resources yet.</p>
        </div>
      ) : (
        <div className="space-y-12">

          {/* Session Grouped Resources */}
          {sessionMappedResources.map(session => (
            <section key={session.id}>
              <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#003B71]"></span>
                {session.title}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {session.resources.map(res => <ResourceCard key={res.id} res={res} />)}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}

function ResourceCard({ res }: { res: any }) {
  const isVideo = res.type === 'video'
  const isDoc = res.type === 'document'

  return (
    <a
      href={res.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-start gap-4 p-5 bg-white hover:bg-slate-50 hover:border-[#003B71]/30 border border-slate-200 rounded-2xl shadow-sm transition-all group relative overflow-hidden"
    >
      <div className={`p-3 rounded-xl shrink-0 mt-1 transition-colors ${
        isVideo ? 'bg-purple-500/10 text-purple-500 group-hover:bg-purple-500 group-hover:text-white' : 
        isDoc ? 'bg-blue-500/10 text-blue-500 group-hover:bg-blue-500 group-hover:text-white' : 
        'bg-amber-500/10 text-amber-500 group-hover:bg-amber-500 group-hover:text-white'
      }`}>
        {isVideo ? (
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72V4.5Z" />
          </svg>
        ) : isDoc ? (
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />
          </svg>
        )}
      </div>
      
      <div className="flex-1 min-w-0">
        <h3 className="text-base font-bold text-slate-900 group-hover:text-[#003B71] transition-colors line-clamp-2">
          {res.title}
        </h3>
        <div className="flex items-center gap-2 mt-2">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
            {new Date(res.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
          <span className="w-1 h-1 rounded-full bg-slate-300"></span>
          <span className={`text-[10px] font-extrabold uppercase tracking-widest ${
            isVideo ? 'text-purple-400' : isDoc ? 'text-blue-400' : 'text-amber-500'
          }`}>
            {isVideo ? 'Video' : isDoc ? 'Document' : 'Web Link'}
          </span>
        </div>
      </div>

      <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5 text-[#003B71]">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
        </svg>
      </div>
    </a>
  )
}
