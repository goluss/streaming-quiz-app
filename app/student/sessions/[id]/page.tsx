import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'

export const generateMetadata = async ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase.from('cohort_sessions').select('title').eq('id', id).single()
  return { title: `${data?.title ?? 'Session'} | Training Portal` }
}

export default async function SessionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: session }, { data: resources }] = await Promise.all([
    supabase
      .from('cohort_sessions')
      .select('id, title, description, cohort_id, cohorts(name, whiteboard_url)')
      .eq('id', id)
      .single(),
    supabase
      .from('cohort_resources')
      .select('*')
      .eq('session_id', id)
      .order('created_at', { ascending: true }),
  ])

  if (!session) notFound()

  const cohortData = Array.isArray(session.cohorts)
    ? session.cohorts[0]
    : (session.cohorts as { name: string; whiteboard_url: string | null } | null)

  const cohortName = cohortData?.name
  const whiteboardUrl = cohortData?.whiteboard_url

  return (
    <div className="space-y-10 max-w-5xl mx-auto px-6 py-10">
      {/* Back + Header */}
      <div>
        <Link
          href="/student"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-[#003B71] transition-colors mb-6"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Dashboard
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-2">
              {cohortName} · Class Session
            </p>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">{session.title}</h1>
            
            <div className="mt-4 flex flex-wrap items-center gap-6">
              {whiteboardUrl && (
                <a 
                  href={whiteboardUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-[#003B71] hover:text-indigo-600 font-black text-[10px] uppercase tracking-widest transition-colors group"
                >
                  <svg className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#003B71] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  Link to Whiteboard
                </a>
              )}
            </div>

            {session.description && (
              <p className="text-slate-500 mt-4 max-w-2xl leading-relaxed">{session.description}</p>
            )}
          </div>
        </div>
      </div>

      {/* Resources */}
      <div>
        <h2 className="text-lg font-extrabold text-slate-900 mb-4">
          Session Materials
          <span className="ml-2 text-sm font-bold text-slate-400">· {resources?.length ?? 0} items</span>
        </h2>

        {!resources || resources.length === 0 ? (
          <div className="text-center py-20 border-2 border-slate-100 border-dashed rounded-2xl bg-white">
            <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center mx-auto mb-4 border border-slate-100">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-slate-300">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
              </svg>
            </div>
            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No materials yet</p>
            <p className="text-slate-500 text-sm mt-2">Your instructor hasn't uploaded any resources for this session.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {resources.map((res) => {
              const isVideo = res.type === 'video'
              const isDoc = res.type === 'document'
              const isPractice = res.type === 'practice'
              const isTest = res.type === 'test'
              if (isPractice) {
                return (
                  <Link
                    key={res.id}
                    href={`/student/practice/${res.transcript_id}`}
                    className="flex items-start gap-4 p-5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-2xl shadow-sm transition-all group relative overflow-hidden"
                  >
                    <div className="p-3 rounded-xl shrink-0 mt-1 bg-emerald-500 text-white shadow-lg shadow-emerald-200">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.905 59.905 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A44.716 44.716 0 0 1 12 13.5a44.71 44.71 0 0 1 8.232-3.353m0 0a40.705 40.705 0 0 0-8.232-4.473" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-bold text-emerald-900 line-clamp-2">
                        {res.title}
                      </h3>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-600/60">
                          {new Date(res.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                        <span className="w-1 h-1 rounded-full bg-emerald-300"></span>
                        <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-600">
                          Interactive Practice
                        </span>
                      </div>
                    </div>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5 text-emerald-600">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                      </svg>
                    </div>
                  </Link>
                )
              }

              if (res.type === 'test') {
                return (
                  <Link
                    key={res.id}
                    href={`/student/test?id=${res.test_id}`}
                    className="flex items-start gap-4 p-5 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-2xl shadow-sm transition-all group relative overflow-hidden"
                  >
                    <div className="p-3 rounded-xl shrink-0 mt-1 bg-amber-500 text-white shadow-lg shadow-amber-200">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-bold text-amber-900 line-clamp-2">
                        {res.title}
                      </h3>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-600/60">
                          {new Date(res.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                        <span className="w-1 h-1 rounded-full bg-amber-300"></span>
                        <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-600">
                          Graded Quiz
                        </span>
                      </div>
                    </div>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5 text-amber-600">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                      </svg>
                    </div>
                  </Link>
                )
              }

              return (
                <a
                  key={res.id}
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
            })}
          </div>
        )}
      </div>
    </div>
  )
}
