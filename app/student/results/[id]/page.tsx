import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/solid'
import { TrophyIcon } from '@heroicons/react/24/outline'
import PerfectScoreAnimation from '@/components/student/PerfectScoreAnimation'

export const metadata = { title: 'Your Results | Training Portal' }

interface AnswerRecord {
  question_id: string
  chosen_answer: string
  correct_answer: string
  is_correct: boolean
}

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function ResultsPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: attempt } = await supabase
    .from('test_attempts')
    .select(`
      id, score, correct_count, total_questions, answers_provided, created_at,
      tests(name)
    `)
    .eq('id', id)
    .eq('user_id', user.id) // RLS-enforce ownership
    .single()

  if (!attempt) redirect('/student')

  const answers: AnswerRecord[] = attempt.answers_provided

  // Fetch question texts for the review
  const questionIds = answers.map((a) => a.question_id)
  const { data: questions } = await supabase
    .from('questions')
    .select('id, question_text, options, category')
    .in('id', questionIds)

  const questionMap = Object.fromEntries((questions ?? []).map((q) => [q.id, q]))

  return (
    <div>
      <PerfectScoreAnimation score={attempt.score} />

      <div className={`relative overflow-hidden rounded-3xl p-10 mb-8 border shadow-2xl ${
        attempt.score === 100
          ? 'bg-gradient-to-br from-amber-500 via-amber-600 to-amber-900 border-amber-400/30'
          : 'bg-white border-slate-200'
      }`}>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.05),transparent_60%)] pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                attempt.score === 100 ? 'bg-amber-400/20 text-white' : 'bg-[#003B71]/10 text-[#003B71]'
              }`}>
                {(Array.isArray(attempt.tests) ? attempt.tests[0] : attempt.tests)?.name ?? 'Quiz'} Results
              </span>
              <span className={`text-[10px] font-bold ${attempt.score === 100 ? 'text-white/60' : 'text-slate-400'}`}>
                {new Date(attempt.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
            
            <h1 className={`text-4xl md:text-5xl font-black tracking-tight mb-2 ${
              attempt.score === 100 ? 'text-white' : 'text-slate-900'
            }`}>
              {attempt.score === 100 ? 'Perfect Score! 🏆' : 'Quiz Completed'}
            </h1>
            <p className={`text-lg font-medium ${attempt.score === 100 ? 'text-white/80' : 'text-slate-500'}`}>
              Great job finishing the assessment. Review your answers below.
            </p>
          </div>

          <div className={`flex flex-col items-center justify-center p-8 rounded-2xl border-2 min-w-[200px] ${
            attempt.score === 100 
              ? 'bg-white/10 border-white/20 text-white' 
              : 'bg-slate-50 border-slate-100 text-[#003B71]'
          }`}>
            <span className="text-6xl font-black tracking-tighter">
              {attempt.correct_count} / {attempt.total_questions}
            </span>
            <span className={`text-xs font-black uppercase tracking-widest mt-1 ${
              attempt.score === 100 ? 'text-white/60' : 'text-slate-400'
            }`}>
              Questions Correct
            </span>
          </div>
        </div>
      </div>

      {/* Email notice */}
      <div className="mb-6 bg-white border border-slate-200 rounded-xl px-4 py-3 flex items-center gap-2 text-sm text-slate-500 shadow-sm">
        <span>📧</span>
        <span>A results summary has been sent to your email.</span>
      </div>

      {/* Review Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-900">Question Review</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Correct answers shown in green · Your incorrect answers shown in red
          </p>
        </div>
        <div className="divide-y divide-slate-100">
          {answers.map((ans, idx) => {
            const q = questionMap[ans.question_id]
            const options: { label: string; text: string }[] = q?.options ?? []
            const chosenText = options.find((o) => o.label === ans.chosen_answer)?.text
            const correctText = options.find((o) => o.label === ans.correct_answer)?.text

            return (
              <div key={ans.question_id} className="px-6 py-4">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex-shrink-0">
                    {ans.is_correct ? (
                      <CheckCircleIcon className="w-5 h-5 text-emerald-500" />
                    ) : (
                      <XCircleIcon className="w-5 h-5 text-red-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-900 mb-2">
                      <span className="text-slate-400 mr-2">Q{idx + 1}.</span>
                      {q?.question_text ?? `Question ${idx + 1}`}
                    </p>
                    <div className="space-y-1">
                      {!ans.is_correct && (
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-slate-400 w-20 flex-shrink-0">Your answer:</span>
                          <span className="text-red-600 font-medium">{ans.chosen_answer}. {chosenText ?? ans.chosen_answer}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-slate-400 w-20 flex-shrink-0">
                          {ans.is_correct ? 'Your answer:' : 'Correct:'}
                        </span>
                        <span className="text-emerald-600 font-medium">{ans.correct_answer}. {correctText ?? ans.correct_answer}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Back to Dashboard */}
      <div className="mt-8 text-center">
        <Link
          href="/student"
          className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm rounded-xl transition-colors"
        >
          ← Back to Dashboard
        </Link>
      </div>
    </div>
  )
}
