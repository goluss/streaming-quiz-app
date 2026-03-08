'use client'

import { useState } from 'react'
import { TableCellsIcon, ChartBarIcon, ClipboardDocumentListIcon, UserCircleIcon } from '@heroicons/react/24/outline'

interface Attempt {
  id: string
  score: number
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  answers_provided: any[]
  created_at: string
  test_id: string
  profiles?: { email: string; full_name?: string | null } | { email: string; full_name?: string | null }[] | null
  tests?: { name: string } | { name: string }[] | null
}

interface Question {
  id: string
  question_text: string
  category: string | null
}

interface LoginEvent {
  id: string
  user_email: string
  ip_address: string
  user_agent: string
  created_at: string
}

interface Props {
  attempts: Attempt[]
  questions: Question[]
  loginActivity: LoginEvent[]
}

export default function AnalyticsClient({ attempts, questions, loginActivity }: Props) {
  const [activeTab, setActiveTab] = useState<'overview' | 'logins'>('overview')

  if (attempts.length === 0 && loginActivity.length === 0) {
    return (
      <div className="max-w-5xl">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Analytics</h1>
        <p className="text-slate-500 mt-2 font-medium mb-12">Track class performance and identify problem areas</p>
        <div className="text-center py-24 bg-white border border-slate-200 rounded-2xl border-dashed">
          <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No activity recorded yet</p>
        </div>
      </div>
    )
  }

  const scores = attempts.map((a) => a.score)
  const avgScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0

  // Score histogram: bins 0-9, 10-19, …, 90-100
  const bins = Array.from({ length: 10 }, (_, i) => ({
    label: `${i * 10}–${i * 10 + 9}`,
    count: 0,
  }))
  bins[9].label = '90–100'
  scores.forEach((s) => {
    const bin = Math.min(Math.floor(s / 10), 9)
    bins[bin].count++
  })
  const maxCount = Math.max(...bins.map((b) => b.count), 1)

  // Per-question error rate
  const questionStats: Record<string, { wrong: number; total: number; text: string }> = {}
  questions.forEach((q) => {
    questionStats[q.id] = { wrong: 0, total: 0, text: q.question_text }
  })
  attempts.forEach((a) => {
    if (a.answers_provided) {
      a.answers_provided.forEach((ans) => {
        if (questionStats[ans.question_id]) {
          questionStats[ans.question_id].total++
          if (!ans.is_correct) questionStats[ans.question_id].wrong++
        }
      })
    }
  })

  const questionList = Object.entries(questionStats)
    .map(([id, s]) => ({
      id,
      text: s.text,
      errorRate: s.total > 0 ? (s.wrong / s.total) * 100 : 0,
      total: s.total,
    }))
    .filter((q) => q.total > 0)
    .sort((a, b) => b.errorRate - a.errorRate)

  // Scores by Test
  const testStats: Record<string, { scores: number[]; name: string }> = {}
  attempts.forEach((a) => {
    const t = Array.isArray(a.tests) ? a.tests[0] : a.tests
    const testName = t?.name || 'Unknown Test'
    if (!testStats[a.test_id]) {
      testStats[a.test_id] = { scores: [], name: testName }
    }
    testStats[a.test_id].scores.push(a.score)
  })

  const testList = Object.entries(testStats).map(([id, s]) => {
    const avg = s.scores.reduce((a, b) => a + b, 0) / s.scores.length
    return { id, name: s.name, avg, count: s.scores.length }
  }).sort((a, b) => b.avg - a.avg)

  return (
    <div className="max-w-5xl space-y-8">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Analytics</h1>
          <p className="text-slate-500 mt-2 font-medium">Track class performance and identify problem areas.</p>
        </div>
        
        <div className="flex bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${
              activeTab === 'overview' ? 'bg-white text-[#003B71] shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('logins')}
            className={`px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${
              activeTab === 'logins' ? 'bg-white text-[#003B71] shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Login Activity
          </button>
        </div>
      </div>

      {activeTab === 'overview' ? (
        <div className="space-y-8 animate-in fade-in duration-500">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { label: 'Total Quizzes', value: attempts.length.toString(), color: 'text-indigo-600', icon: ClipboardDocumentListIcon },
              { label: 'Average Score', value: `${avgScore.toFixed(0)}%`, color: 'text-[#003B71]', icon: ChartBarIcon },
              { label: 'Success Velocity', value: `High`, color: 'text-emerald-600', icon: TrophyIconReplacement },
            ].map((kpi) => (
              <div key={kpi.label} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{kpi.label}</p>
                    <p className={`text-3xl font-black mt-1 ${kpi.color}`}>{kpi.value}</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Histogram */}
            <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
                <h2 className="text-lg font-bold text-slate-900 mb-8">Score Distribution</h2>
                <div className="flex items-end gap-2 h-44 px-2">
                {bins.map((bin) => (
                    <div key={bin.label} className="flex-1 flex flex-col items-center gap-2 group">
                    <span className="text-[10px] font-black text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">{bin.count > 0 ? bin.count : ''}</span>
                    <div
                        className="w-full bg-[#003B71]/10 group-hover:bg-[#003B71] rounded-t-lg transition-all duration-500"
                        style={{ height: `${(bin.count / maxCount) * 100}%`, minHeight: bin.count > 0 ? '8px' : '0' }}
                    />
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-tight leading-none rotate-45 mt-2 origin-left whitespace-nowrap">{bin.label}</span>
                    </div>
                ))}
                </div>
                <div className="mt-12 flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#003B71]" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Students per score range</span>
                </div>
            </div>

            {/* Most Missed */}
            <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
                <h2 className="text-lg font-bold text-slate-900 mb-6">Critical Review Areas</h2>
                <div className="space-y-4">
                    {questionList.slice(0, 5).map((q, i) => (
                    <div key={q.id} className="group">
                        <div className="flex justify-between items-center mb-1.5 px-1">
                            <p className="text-xs font-bold text-slate-700 truncate pr-4">{q.text}</p>
                            <span className="text-[10px] font-black text-red-500 uppercase shrink-0">{q.errorRate.toFixed(0)}% Error</span>
                        </div>
                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-red-500 rounded-full transition-all duration-1000"
                                style={{ width: `${q.errorRate}%` }}
                            />
                        </div>
                    </div>
                    ))}
                    {questionList.length === 0 && <p className="text-center py-12 text-xs text-slate-400 font-bold uppercase tracking-widest italic">No data yet</p>}
                </div>
            </div>
          </div>

          {/* Scores by Test */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="p-6 border-b border-slate-100 bg-slate-50/30">
                <h2 className="text-sm font-black text-[#003B71] uppercase tracking-widest">Quiz Performance</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="text-xs text-slate-400 uppercase bg-slate-50/50 border-b border-slate-100">
                    <th className="px-6 py-4 font-black tracking-wider">Quiz Name</th>
                    <th className="px-6 py-4 font-black tracking-wider text-center">Attempts</th>
                    <th className="px-6 py-4 font-black tracking-wider text-right">Avg Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {testList.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 text-slate-900 font-bold">{t.name}</td>
                      <td className="px-6 py-4 text-slate-500 font-medium text-center">{t.count}</td>
                      <td className="px-6 py-4 text-right">
                        <span className={`px-2 py-1 rounded-md text-xs font-black ${t.avg >= 80 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                          {t.avg.toFixed(0)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm animate-in slide-in-from-right-4 duration-500">
          <div className="p-6 border-b border-slate-100 bg-slate-50/30 flex justify-between items-center">
                <h2 className="text-sm font-black text-[#003B71] uppercase tracking-widest">Master Login Log</h2>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Last 200 Sessions</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#003B71]/5 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">User / Email</th>
                    <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">IP Address</th>
                    <th className="px-6 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Platform</th>
                    <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Timestamp</th>
                  </tr>
                </thead>
              <tbody className="divide-y divide-slate-100">
                {loginActivity.length === 0 ? (
                  <tr><td colSpan={4} className="px-6 py-20 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">No logins recorded</td></tr>
                ) : (
                  loginActivity.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50 transition-colors text-xs">
                      <td className="px-6 py-4 flex items-center gap-3">
                        <UserCircleIcon className="w-5 h-5 text-slate-300" />
                        <span className="font-bold text-slate-900">{log.user_email}</span>
                      </td>
                      <td className="px-6 py-4 text-slate-500 font-medium font-mono">{log.ip_address}</td>
                      <td className="px-6 py-4 text-slate-500 font-medium truncate max-w-xs" title={log.user_agent}>
                        {log.user_agent}
                      </td>
                      <td className="px-6 py-4 text-right text-slate-400 font-black">
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

function TrophyIconReplacement({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
        </svg>
    )
}
