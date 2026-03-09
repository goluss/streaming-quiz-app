import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export const metadata = { title: 'My Quizzes | Training Portal' }

export default async function StudentQuizzesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: attempts } = await supabase
    .from('test_attempts')
    .select(`
      id, score, correct_count, total_questions, created_at,
      transcripts ( title ),
      tests ( name )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-12 max-w-5xl mx-auto px-6 py-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-extrabold text-[#003B71] tracking-tight">My Quizzes</h1>
          <p className="text-lg text-slate-500 mt-3 font-medium">
            Review your past performance and track your progress over time.
          </p>
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight mb-8 flex items-center gap-3">
          Past Results
          <span className="px-3 py-1 bg-slate-100 text-slate-500 text-xs font-black rounded-full border border-slate-200">
            {attempts?.length || 0}
          </span>
        </h2>

        {!attempts || attempts.length === 0 ? (
          <div className="text-center py-20 border-2 border-slate-100 border-dashed rounded-3xl bg-white shadow-sm">
            <div className="w-16 h-16 bg-slate-50 text-slate-200 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-slate-100">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z" />
              </svg>
            </div>
            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No quiz history</p>
            <p className="text-slate-500 text-sm mt-2">Enter a code above to start your first assessment.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {attempts.map((attempt) => {
              const testInfo = Array.isArray(attempt.tests) ? attempt.tests[0] : attempt.tests
              const transcriptInfo = Array.isArray(attempt.transcripts) ? attempt.transcripts[0] : attempt.transcripts
              
              return (
                <Link
                  key={attempt.id}
                  href={`/student/results/${attempt.id}`}
                  className="flex flex-col bg-white border border-slate-200 rounded-2xl p-6 hover:border-[#003B71]/30 hover:shadow-xl transition-all group relative overflow-hidden"
                >
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#003B71]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  
                  <div className="flex justify-between items-start mb-6">
                    <h3 className="font-bold text-slate-900 text-lg group-hover:text-[#003B71] transition-colors leading-tight line-clamp-2 pr-4">
                      {testInfo?.name || 'Quiz'}
                    </h3>
                  </div>
                  
                  <div className="mb-6 flex-1">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Source Material</p>
                    <p className="text-sm font-medium text-slate-600 line-clamp-1">
                      {transcriptInfo?.title || 'Unknown Source'}
                    </p>
                  </div>
                  
                  <div className="flex justify-between items-end pt-4 border-t border-slate-100">
                    <div className="space-y-1">
                      <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
                        {new Date(attempt.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                    
                    <div className="flex flex-col items-end">
                      <span className="text-2xl font-black tracking-tighter text-[#003B71]">
                        {attempt.correct_count} / {attempt.total_questions}
                      </span>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Correct</p>
                    </div>
                  </div>

                  <div className="absolute right-6 top-6 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                    <div className="w-8 h-8 rounded-full bg-[#003B71]/10 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4 text-[#003B71]">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                      </svg>
                    </div>
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
