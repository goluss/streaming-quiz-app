'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeftIcon, ArrowsUpDownIcon } from '@heroicons/react/24/outline'

interface StudentAttempt {
  id: string
  score: number
  correct_count: number
  total_questions: number
  created_at: string
  student_name: string | null
  student_email: string | null
}

interface QuestionStat {
  question_id: string
  question_text: string
  correct: number
  incorrect: number
  total: number
}

interface Props {
  test: {
    id: string
    name: string
    code: string
    created_at: string
    transcripts?: { title: string } | null
    cohorts?: { name: string } | null
  }
  attempts: StudentAttempt[]
  questionStats: QuestionStat[]
}

type SortKey = 'question' | 'correct' | 'incorrect' | 'pct'
type SortDir = 'asc' | 'desc'

// Score histogram buckets
const BUCKETS = [
  { label: '0–20%', min: 0, max: 20 },
  { label: '20–40%', min: 20, max: 40 },
  { label: '40–60%', min: 40, max: 60 },
  { label: '60–80%', min: 60, max: 80 },
  { label: '80–100%', min: 80, max: 101 },
]

function getScoreColor(score: number) {
  if (score >= 80) return 'text-emerald-600'
  if (score >= 60) return 'text-amber-600'
  return 'text-red-500'
}

function getBarColor(score: number) {
  if (score >= 80) return 'bg-emerald-500'
  if (score >= 60) return 'bg-amber-400'
  return 'bg-red-400'
}

export default function TestDetailClient({ test, attempts, questionStats }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>('pct')
  const [sortDir, setSortDir] = useState<SortDir>('asc')

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  // Build histogram
  const bucketCounts = BUCKETS.map(b => ({
    ...b,
    count: attempts.filter(a => a.score >= b.min && a.score < b.max).length
  }))
  const maxBucketCount = Math.max(...bucketCounts.map(b => b.count), 1)

  // Average score
  const avgScore = attempts.length > 0
    ? Math.round(attempts.reduce((sum, a) => sum + a.score, 0) / attempts.length)
    : null

  // Sort question stats
  const sortedQuestions = [...questionStats].sort((a, b) => {
    let valA: number | string = 0
    let valB: number | string = 0

    if (sortKey === 'question') { valA = a.question_text; valB = b.question_text }
    else if (sortKey === 'correct') { valA = a.correct; valB = b.correct }
    else if (sortKey === 'incorrect') { valA = a.incorrect; valB = b.incorrect }
    else if (sortKey === 'pct') {
      valA = a.total > 0 ? a.correct / a.total : 0
      valB = b.total > 0 ? b.correct / b.total : 0
    }

    if (typeof valA === 'string') {
      return sortDir === 'asc' ? valA.localeCompare(valB as string) : (valB as string).localeCompare(valA)
    }
    return sortDir === 'asc' ? (valA as number) - (valB as number) : (valB as number) - (valA as number)
  })

  const SortIcon = ({ col }: { col: SortKey }) => (
    <ArrowsUpDownIcon
      className={`w-3.5 h-3.5 inline ml-1 ${sortKey === col ? 'text-[#003B71]' : 'text-slate-300'}`}
    />
  )

  return (
    <div className="max-w-5xl mx-auto space-y-10 px-6 py-10">
      {/* Back + Header */}
      <div>
        <Link
          href="/admin/tests"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-[#003B71] transition-colors mb-6"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          Back to Quiz Assignments
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">{test.name}</h1>
            <div className="flex flex-wrap items-center gap-3 mt-2">
              <span className="font-mono text-indigo-600 font-bold text-sm bg-indigo-50 px-3 py-1 rounded-lg border border-indigo-100">
                Code: {test.code}
              </span>
              {test.cohorts?.name && (
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Cohort: {test.cohorts.name}
                </span>
              )}
              {test.transcripts?.title && (
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Source: {test.transcripts.title}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-6 text-center">
            <div className="bg-white border border-slate-200 rounded-xl px-6 py-4 shadow-sm">
              <p className="text-3xl font-black text-slate-900">{attempts.length}</p>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">Attempts</p>
            </div>
            {avgScore !== null && (
              <div className="bg-white border border-slate-200 rounded-xl px-6 py-4 shadow-sm">
                <p className={`text-3xl font-black ${getScoreColor(avgScore)}`}>{avgScore}%</p>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">Avg Score</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {attempts.length === 0 ? (
        <div className="text-center py-24 bg-white border border-dashed border-slate-200 rounded-2xl">
          <p className="font-bold text-slate-400 uppercase tracking-widest text-xs">No attempts yet</p>
        </div>
      ) : (
        <>
          {/* Score Distribution Histogram */}
          <div className="bg-white border border-slate-200 rounded-3xl p-10 shadow-sm relative overflow-hidden">
            <h2 className="text-xl font-bold text-slate-900 mb-8 flex items-center gap-3">
              Score Distribution
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
                Quiz Result Spread
              </span>
            </h2>
            
            <div className="space-y-4">
              {bucketCounts.map(b => {
                const pct = (b.count / maxBucketCount) * 100
                const bucketColor = b.min >= 80 ? 'bg-emerald-500' : b.min >= 60 ? 'bg-amber-400' : b.min >= 40 ? 'bg-yellow-400' : b.min >= 20 ? 'bg-orange-400' : 'bg-red-400'
                
                return (
                  <div key={b.label} className="group flex items-center gap-6">
                    <div className="w-24 text-right">
                      <span className="text-xs font-black text-slate-400 group-hover:text-slate-600 transition-colors">{b.label}</span>
                    </div>
                    <div className="flex-1 bg-slate-50 border border-slate-100 rounded-2xl h-10 overflow-hidden relative shadow-inner">
                      <div
                        className={`h-full rounded-2xl transition-all duration-1000 ease-out flex items-center justify-end px-4 ${bucketColor}`}
                        style={{ width: `${pct}%`, minWidth: b.count > 0 ? '3rem' : '0' }}
                      >
                        {b.count > 0 && pct > 10 && (
                          <span className="text-[10px] font-black text-white uppercase tracking-widest whitespace-nowrap">
                            {b.count} Student{b.count !== 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                      {/* Count fallback if bar is too small */}
                      {b.count > 0 && pct <= 10 && (
                        <div className="absolute left-[calc(10%+12px)] top-1/2 -translate-y-1/2">
                           <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                             {b.count}
                           </span>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
            
            <div className="mt-10 pt-6 border-t border-slate-100 flex flex-wrap gap-8 items-center justify-center">
              <div className="flex items-center gap-2">
                 <div className="w-3 h-3 rounded-full bg-emerald-500" />
                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Exceptional (80%+)</span>
              </div>
              <div className="flex items-center gap-2">
                 <div className="w-3 h-3 rounded-full bg-amber-400" />
                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Passing (60-80%)</span>
              </div>
              <div className="flex items-center gap-2">
                 <div className="w-3 h-3 rounded-full bg-red-400" />
                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Needs Review (&lt;60%)</span>
              </div>
            </div>
          </div>

          {/* Student Scores */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-8 py-5 border-b border-slate-100 bg-slate-50">
              <h2 className="text-lg font-bold text-slate-900">Student Scores</h2>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mt-0.5">
                {attempts.length} student{attempts.length !== 1 ? 's' : ''} attempted
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-left">
                    <th className="px-6 py-3 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Student</th>
                    <th className="px-6 py-3 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest text-center">Score %</th>
                    <th className="px-6 py-3 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest text-center">Correct</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {attempts
                    .sort((a, b) => b.score - a.score)
                    .map(a => (
                      <tr key={a.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <p className="font-semibold text-slate-900">{a.student_name || 'Unknown'}</p>
                          <p className="text-xs text-slate-400">{a.student_email}</p>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <span className={`text-lg font-black ${getScoreColor(a.score)}`}>{a.score}%</span>
                            <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${getBarColor(a.score)}`}
                                style={{ width: `${a.score}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-600 font-medium">
                          {a.correct_count} / {a.total_questions}
                        </td>
                        <td className="px-6 py-4 text-slate-400 text-xs font-medium">
                          {new Date(a.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Question Analysis */}
          {sortedQuestions.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="px-8 py-5 border-b border-slate-100 bg-slate-50">
                <h2 className="text-lg font-bold text-slate-900">Question Analysis</h2>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mt-0.5">
                  Click column headers to sort
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-left">
                      <th
                        className="px-6 py-3 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest cursor-pointer hover:text-slate-700 transition-colors"
                        onClick={() => handleSort('question')}
                      >
                        Question <SortIcon col="question" />
                      </th>
                      <th
                        className="px-6 py-3 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest cursor-pointer hover:text-slate-700 transition-colors whitespace-nowrap"
                        onClick={() => handleSort('correct')}
                      >
                        ✓ Correct <SortIcon col="correct" />
                      </th>
                      <th
                        className="px-6 py-3 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest cursor-pointer hover:text-slate-700 transition-colors whitespace-nowrap"
                        onClick={() => handleSort('incorrect')}
                      >
                        ✗ Incorrect <SortIcon col="incorrect" />
                      </th>
                      <th
                        className="px-6 py-3 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest cursor-pointer hover:text-slate-700 transition-colors whitespace-nowrap"
                        onClick={() => handleSort('pct')}
                      >
                        % Correct <SortIcon col="pct" />
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {sortedQuestions.map((q, idx) => {
                      const pct = q.total > 0 ? Math.round((q.correct / q.total) * 100) : 0
                      return (
                        <tr key={q.question_id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4 max-w-sm">
                            <div className="flex items-start gap-3">
                              <span className="text-[10px] font-black text-slate-300 mt-0.5 shrink-0">
                                {String(idx + 1).padStart(2, '0')}
                              </span>
                              <p className="text-slate-800 font-medium leading-snug line-clamp-3">{q.question_text}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-emerald-600 font-bold">{q.correct}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-red-500 font-bold">{q.incorrect}</span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <span className={`font-black text-base ${getScoreColor(pct)}`}>{pct}%</span>
                              <div className="w-20 h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${getBarColor(pct)}`}
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
