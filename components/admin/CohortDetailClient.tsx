'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ArrowDownTrayIcon, UserPlusIcon, CheckCircleIcon, XMarkIcon, ChartPieIcon, TableCellsIcon, LinkIcon, PlusIcon, TrashIcon, CloudArrowUpIcon, PaperClipIcon, FilmIcon, DocumentTextIcon, ChevronDownIcon, ChevronUpIcon, TrophyIcon, PencilIcon, CheckIcon, AcademicCapIcon, UserGroupIcon } from '@heroicons/react/24/outline'

interface Profile {
  id: string
  email: string
  full_name: string | null
  role: string
}

interface Cohort {
  id: string
  name: string
  whiteboard_url?: string | null
  created_at: string
}

interface CohortSession {
  id: string
  title: string
  description: string | null
  created_at: string
}

interface TestAttempt {
  id: string
  score: number
  total_questions: number
  correct_count: number
  created_at: string
  answers_provided?: any[]
  profiles?: { full_name: string | null, email: string } | { full_name: string | null, email: string }[] | null
  tests?: { name: string, cohort_id: string, transcripts?: { title: string } | { title: string }[] } | { name: string, cohort_id: string, transcripts?: { title: string } | { title: string }[] }[] | null
}

interface QuestionStat {
  id: string
  question_text: string
  category: string
  total_attempts: number
  correct_count: number
}

interface CohortResource {
  id: string
  title: string
  url: string
  type: 'link' | 'document' | 'video' | 'practice'
  file_path?: string
  transcript_id?: string | null
  session_id?: string | null
  section_title?: string | null
  created_at: string
}

interface Props {
  cohort: Cohort
  initialSessions: CohortSession[]
  transcripts: { id: string, title: string }[]
  globalResources: { id: string, title: string, url: string, type: 'link' | 'document' | 'video', file_path?: string }[]
  students: { id: string, full_name: string | null, email: string, created_at: string }[]
}

export default function CohortDetailClient({ cohort, initialSessions, transcripts, globalResources, students }: Props) {
  const [sessions, setSessions] = useState<CohortSession[]>(initialSessions)
  const [analytics, setAnalytics] = useState<TestAttempt[]>([])
  const [questionStats, setQuestionStats] = useState<QuestionStat[]>([])
  const [resources, setResources] = useState<CohortResource[]>([])
  
  const [activeTab, setActiveTab] = useState<'scores' | 'students' | 'sessions' | 'leaderboard'>('scores')
  const [loadingAnalytics, setLoadingAnalytics] = useState(true)
  const [loadingResources, setLoadingResources] = useState(true)
  
  // Session form state
  const [newSessionTitle, setNewSessionTitle] = useState('')
  const [newSessionDesc, setNewSessionDesc] = useState('')
  const [creatingSession, setCreatingSession] = useState(false)
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null)
  
  const [cohortName, setCohortName] = useState(cohort.name)
  const [isEditingName, setIsEditingName] = useState(false)
  const [savingName, setSavingName] = useState(false)

  const [whiteboardUrl, setWhiteboardUrl] = useState(cohort.whiteboard_url || '')
  const [isEditingUrl, setIsEditingUrl] = useState(false)
  const [savingUrl, setSavingUrl] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    fetchCohortAnalytics()
    fetchResources()
  }, [cohort.id])

  const fetchResources = async () => {
    setLoadingResources(true)
    
    try {
      // Get all resources for this cohort OR resources linked to any of this cohort's sessions
      const sessionIds = sessions.map(s => s.id)
      
      let query = supabase
        .from('cohort_resources')
        .select('*')
      
      if (sessionIds.length > 0) {
        query = query.or(`cohort_id.eq.${cohort.id},session_id.in.(${sessionIds.join(',')})`)
      } else {
        query = query.eq('cohort_id', cohort.id)
      }

      const { data, error } = await query.order('created_at', { ascending: false })
      
      if (error) throw error
      setResources(data || [])
    } catch (err: any) {
      console.error('Error fetching resources:', err)
    } finally {
      setLoadingResources(false)
    }
  }

  // Refetch resources if sessions change (as sessionIds are used in the fetch)
  useEffect(() => {
    if (sessions.length > 0) {
      fetchResources()
    }
  }, [sessions.length])

  const handleUpdateName = async () => {
    if (!cohortName.trim() || cohortName === cohort.name) {
      setIsEditingName(false)
      return
    }
    setSavingName(true)
    const { error } = await supabase
      .from('cohorts')
      .update({ name: cohortName.trim() })
      .eq('id', cohort.id)
    
    if (error) {
      alert('Failed to update name: ' + error.message)
      setCohortName(cohort.name)
    }
    setSavingName(false)
    setIsEditingName(false)
  }

  const handleUpdateUrl = async () => {
    setSavingUrl(true)
    const { error } = await supabase
      .from('cohorts')
      .update({ whiteboard_url: whiteboardUrl.trim() || null })
      .eq('id', cohort.id)
    
    if (error) {
      alert('Failed to update link: ' + error.message)
      setWhiteboardUrl(cohort.whiteboard_url || '')
    }
    setSavingUrl(false)
    setIsEditingUrl(false)
  }

  const fetchCohortAnalytics = async () => {
    setLoadingAnalytics(true)
    const { data: lbData } = await supabase
      .from('test_attempts')
      .select(`
        id, score, total_questions, correct_count, created_at, answers_provided,
        profiles ( full_name, email ),
        tests!inner ( name, cohort_id, transcripts ( title ) )
      `)
      .eq('tests.cohort_id', cohort.id)
      .order('created_at', { ascending: false })
    
    const attempts = (lbData as any) ?? []
    setAnalytics(attempts)
    setLoadingAnalytics(false)
  }

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newSessionTitle.trim()) return

    setCreatingSession(true)
    const { data, error } = await supabase
      .from('cohort_sessions')
      .insert({
        cohort_id: cohort.id,
        title: newSessionTitle.trim(),
        description: newSessionDesc.trim()
      })
      .select()
      .single()

    if (!error && data) {
      setSessions([...sessions, data])
      setNewSessionTitle('')
      setNewSessionDesc('')
    }
    setCreatingSession(false)
  }

  const handleDeleteSession = async (sessionId: string) => {
    if (!window.confirm('Delete this session and all its resources?')) return
    const { error } = await supabase
      .from('cohort_sessions')
      .delete()
      .eq('id', sessionId)

    if (!error) {
      setSessions(sessions.filter(s => s.id !== sessionId))
      setResources(resources.filter(r => r.session_id !== sessionId))
    }
  }

  const handleAssignResource = async (sessionId: string, resourceId: string) => {
    const resource = globalResources.find(r => r.id === resourceId)
    if (!resource) {
      console.error('Resource not found in library:', resourceId)
      return
    }

    setLoadingResources(true)
    try {
      const { assignResource } = await import('../../app/admin/cohorts/actions')
      const result = await assignResource({
        cohortId: cohort.id,
        sessionId,
        title: resource.title,
        url: resource.url,
        type: resource.type,
        filePath: resource.file_path,
        sectionTitle: 'Session Materials'
      })

      if (result.success && result.data) {
        setResources(prev => [result.data as CohortResource, ...prev])
      } else {
        alert(`Failed to assign resource: ${result.error}`)
      }
    } catch (err: any) {
      console.error('Unexpected error in handleAssignResource:', err)
      alert('An unexpected error occurred.')
    } finally {
      setLoadingResources(false)
    }
  }

  const handleAssignPractice = async (sessionId: string, transcriptId: string) => {
    const transcript = transcripts.find(t => t.id === transcriptId)
    if (!transcript) {
      console.error('Transcript not found:', transcriptId)
      return
    }

    setLoadingResources(true)
    
    // find the order from the sessions state
    const orderNum = sessions.findIndex(s => s.id === sessionId) + 1

    try {
      const { assignPractice } = await import('../../app/admin/cohorts/actions')
      const result = await assignPractice({
        cohortId: cohort.id,
        sessionId,
        transcriptId,
        title: `Session ${orderNum} - Practice Questions`,
        sectionTitle: 'Session Materials'
      })

      if (result.success && result.data) {
        setResources(prev => [result.data as CohortResource, ...prev])
      } else {
        alert(`Failed to assign practice: ${result.error}`)
      }
    } catch (err: any) {
      console.error('Unexpected error in handleAssignPractice:', err)
      alert('An unexpected error occurred.')
    } finally {
      setLoadingResources(false)
    }
  }

  const handleDeleteResource = async (resourceId: string) => {
    if (!window.confirm('Remove this resource from the session?')) return
    const { error } = await supabase
      .from('cohort_resources')
      .delete()
      .eq('id', resourceId)

    if (!error) {
      setResources(resources.filter(r => r.id !== resourceId))
    }
  }

  const downloadCSV = () => {
    if (analytics.length === 0) return
    const headers = ['Student Name', 'Student Email', 'Quiz Name', 'Source Module', 'Score (%)', 'Questions Correct', 'Total Questions', 'Date Taken']
    const rows = analytics.map(attempt => {
      const p = Array.isArray(attempt.profiles) ? attempt.profiles[0] : attempt.profiles
      const t = Array.isArray(attempt.tests) ? attempt.tests[0] : attempt.tests
      const trans = Array.isArray(t?.transcripts) ? t?.transcripts[0] : t?.transcripts
      const correctCount = Math.round((attempt.score / 100) * attempt.total_questions)
      return [
        `"${p?.full_name || 'Anonymous'}"`,
        `"${p?.email || ''}"`,
        `"${t?.name || 'Unknown Quiz'}"`,
        `"${trans?.title || 'Unknown Source'}"`,
        attempt.score,
        correctCount,
        attempt.total_questions,
        `"${new Date(attempt.created_at).toLocaleString()}"`
      ].join(',')
    })
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `${cohort.name.replace(/\s+/g, '_')}_Analytics.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-8">
      {/* Header with Edit Functionality */}
      <div className="mb-0">
        <div className="flex items-center gap-4">
          {isEditingName ? (
            <div className="flex items-center gap-3 w-full max-w-xl">
              <input
                type="text"
                value={cohortName}
                onChange={(e) => setCohortName(e.target.value)}
                autoFocus
                className="text-3xl font-bold text-slate-900 bg-white border-b-2 border-[#003B71] focus:outline-none w-full py-1"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleUpdateName()
                  if (e.key === 'Escape') { setIsEditingName(false); setCohortName(cohort.name); }
                }}
              />
              <button 
                onClick={handleUpdateName}
                disabled={savingName}
                className="p-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 transition-colors disabled:opacity-50"
              >
                {savingName ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <CheckIcon className="w-5 h-5" />}
              </button>
              <button 
                onClick={() => { setIsEditingName(false); setCohortName(cohort.name); }}
                className="p-2 bg-slate-100 text-slate-500 rounded-lg hover:bg-slate-200 transition-colors"
                disabled={savingName}
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <div className="group flex items-center gap-3">
              <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{cohortName}</h1>
              <button 
                onClick={() => setIsEditingName(true)}
                className="p-1.5 text-slate-400 hover:text-[#003B71] hover:bg-slate-100 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                title="Rename Cohort"
              >
                <PencilIcon className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
        <div className="mt-2 flex items-center gap-4">
          <p className="text-slate-500 font-medium">Manage students, sessions, resources, and analytics.</p>
          <div className="h-4 w-px bg-slate-200" />
          {isEditingUrl ? (
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <input
                type="text"
                placeholder="Custom Link (e.g. Zoom, Drive)"
                value={whiteboardUrl}
                onChange={(e) => setWhiteboardUrl(e.target.value)}
                className="text-sm border-b border-[#003B71] focus:outline-none w-full py-0.5 bg-transparent"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleUpdateUrl()
                  if (e.key === 'Escape') { setIsEditingUrl(false); setWhiteboardUrl(cohort.whiteboard_url || ''); }
                }}
              />
              <button onClick={handleUpdateUrl} disabled={savingUrl} className="text-emerald-600 hover:text-emerald-500">
                <CheckIcon className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 group">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Original Link:</span>
              {whiteboardUrl ? (
                <a href={whiteboardUrl} target="_blank" rel="noreferrer" className="text-sm font-bold text-[#003B71] hover:underline truncate max-w-[200px]">
                  {whiteboardUrl}
                </a>
              ) : (
                <span className="text-sm text-slate-300 italic">None set</span>
              )}
              <button 
                onClick={() => setIsEditingUrl(true)}
                className="p-1 text-slate-300 hover:text-[#003B71] transition-all opacity-0 group-hover:opacity-100"
              >
                <PencilIcon className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 space-y-8">
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm flex flex-col h-full">
          <div className="p-6 border-b border-slate-100 flex flex-wrap gap-4 justify-between items-center bg-slate-50/30">
            <div className="flex flex-wrap gap-2 sm:gap-4">
              <button
                onClick={() => setActiveTab('scores')}
                className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
                  activeTab === 'scores' ? 'bg-[#003B71] text-white shadow-lg shadow-[#003B71]/20' : 'text-slate-500 hover:text-[#003B71] hover:bg-slate-100'
                }`}
              >
                <TableCellsIcon className="w-5 h-5" />
                Scores
              </button>
              <button
                onClick={() => setActiveTab('students')}
                className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
                  activeTab === 'students' ? 'bg-[#003B71] text-white shadow-lg shadow-[#003B71]/20' : 'text-slate-500 hover:text-[#003B71] hover:bg-slate-100'
                }`}
              >
                <UserGroupIcon className="w-5 h-5" />
                Students
              </button>
              <button
                onClick={() => setActiveTab('sessions')}
                className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
                  activeTab === 'sessions' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/20' : 'text-slate-500 hover:text-indigo-600 hover:bg-indigo-50'
                }`}
              >
                <DocumentTextIcon className="w-5 h-5" />
                Sessions
              </button>
              <button
                onClick={() => setActiveTab('leaderboard')}
                className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
                  activeTab === 'leaderboard' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/20' : 'text-slate-500 hover:text-emerald-600 hover:bg-emerald-50'
                }`}
              >
                <TrophyIcon className="w-5 h-5" />
                Leaderboard
              </button>
            </div>
            
            {activeTab === 'scores' && (
              <button
                onClick={downloadCSV}
                disabled={loadingAnalytics || analytics.length === 0}
                className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
              >
                <ArrowDownTrayIcon className="w-5 h-5" />
                <span>CSV</span>
              </button>
            )}
          </div>

          <div className="flex-1 overflow-x-auto min-h-[500px]">
            {activeTab === 'scores' ? (
              <table className="w-full text-left text-sm">
                <thead className="text-xs text-slate-400 uppercase bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="px-5 py-4 font-bold tracking-wider">Student</th>
                    <th className="px-5 py-4 font-bold tracking-wider">Quiz</th>
                    <th className="px-5 py-4 font-bold tracking-wider text-right">Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {loadingAnalytics ? (
                    <tr><td colSpan={3} className="px-5 py-12 text-center text-slate-500 italic">Loading scores...</td></tr>
                  ) : analytics.length === 0 ? (
                    <tr><td colSpan={3} className="px-5 py-12 text-center text-slate-500 italic">No quiz attempts found.</td></tr>
                  ) : (
                    analytics.map(attempt => {
                      const p = Array.isArray(attempt.profiles) ? attempt.profiles[0] : attempt.profiles
                      const t = Array.isArray(attempt.tests) ? attempt.tests[0] : attempt.tests
                      return (
                        <tr key={attempt.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-5 py-4">
                            <p className="font-bold text-slate-900">{p?.full_name || 'Anonymous'}</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase">{p?.email}</p>
                          </td>
                          <td className="px-5 py-4 text-slate-500 font-medium">{t?.name || 'Unknown'}</td>
                          <td className="px-5 py-4 text-right">
                           <span className={`px-2 py-1 rounded-md text-xs font-black ${attempt.score >= 80 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                             {attempt.correct_count} / {attempt.total_questions}
                           </span>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            ) : activeTab === 'leaderboard' ? (
              <div className="p-6">
                <div className="bg-white border border-slate-200 rounded-2xl p-6 text-slate-900 mb-8 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-[#003B71]/5 rounded-full -mr-16 -mt-16 blur-2xl" />
                  <h3 className="text-xl font-black tracking-tight mb-1">Top Performers</h3>
                  <p className="text-[#003B71] text-xs font-bold uppercase tracking-widest">Cohort Rankings</p>
                </div>

                <div className="space-y-3">
                  {(() => {
                    const studentStats: Record<string, { name: string, email: string, totalCorrect: number, totalQuestions: number, avgScore: number, attempts: number }> = {}
                    analytics.forEach(a => {
                      const p = Array.isArray(a.profiles) ? a.profiles[0] : a.profiles
                      const email = p?.email || 'Unknown'
                      if (!studentStats[email]) {
                        studentStats[email] = { name: p?.full_name || 'Anonymous', email, totalCorrect: 0, totalQuestions: 0, avgScore: 0, attempts: 0 }
                      }
                      studentStats[email].totalCorrect += a.correct_count
                      studentStats[email].totalQuestions += a.total_questions
                      studentStats[email].attempts += 1
                    })

                    return Object.values(studentStats)
                      .sort((a, b) => (b.totalCorrect / b.totalQuestions) - (a.totalCorrect / a.totalQuestions) || b.totalCorrect - a.totalCorrect)
                      .map((stat, i) => (
                        <div key={stat.email} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md transition-all group">
                          <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black ${
                              i === 0 ? 'bg-amber-100 text-amber-600' :
                              i === 1 ? 'bg-slate-100 text-slate-500' :
                              i === 2 ? 'bg-orange-100 text-orange-600' : 'bg-slate-50 text-slate-300'
                            }`}>
                              {i + 1}
                            </div>
                            <div>
                              <p className="font-bold text-slate-900 group-hover:text-[#003B71] transition-colors">{stat.name}</p>
                              <p className="text-[10px] text-slate-400 font-bold uppercase">{stat.attempts} quizzes completed</p>
                            </div>
                          </div>
                          <div className="text-right">
                             <p className="text-lg font-black text-[#003B71]">
                               {stat.totalCorrect} / {stat.totalQuestions}
                             </p>
                             <p className="text-[10px] font-bold text-slate-400 uppercase">Total Correct</p>
                          </div>
                        </div>
                      ))
                  })()}
                </div>
              </div>
            ) : activeTab === 'students' ? (
              <div className="p-0">
                <table className="w-full text-left text-sm">
                  <thead className="text-xs text-slate-400 uppercase bg-slate-50 border-b border-slate-100">
                    <tr>
                      <th className="px-5 py-4 font-bold tracking-wider">Student Name</th>
                      <th className="px-5 py-4 font-bold tracking-wider">Email</th>
                      <th className="px-5 py-4 font-bold tracking-wider text-right">Join Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {students.length === 0 ? (
                      <tr><td colSpan={3} className="px-5 py-12 text-center text-slate-500 italic">No students assigned to this cohort yet.</td></tr>
                    ) : (
                      students.map(s => (
                        <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-5 py-4 font-bold text-slate-900">{s.full_name || 'Anonymous'}</td>
                          <td className="px-5 py-4 text-slate-500">{s.email}</td>
                          <td className="px-5 py-4 text-right text-slate-400 font-medium">
                            {new Date(s.created_at).toLocaleDateString()}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            ) : activeTab === 'sessions' ? (
              <div className="p-6 space-y-6">
                {/* Create Session */}
                <form onSubmit={handleCreateSession} className="bg-slate-50 border border-slate-200 rounded-2xl p-6 shadow-sm">
                  <h4 className="text-sm font-black text-[#003B71] uppercase tracking-widest mb-4">Create New Session</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <input
                      type="text"
                      required
                      placeholder="Session Title (e.g., Week 1: Onboarding)"
                      value={newSessionTitle}
                      onChange={(e) => setNewSessionTitle(e.target.value)}
                      className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#003B71]/20 focus:border-[#003B71] outline-none"
                    />
                    <div className="flex gap-2">
                       <input
                        type="text"
                        placeholder="Description (optional)"
                        value={newSessionDesc}
                        onChange={(e) => setNewSessionDesc(e.target.value)}
                        className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#003B71]/20 focus:border-[#003B71] outline-none"
                      />
                      <button
                        type="submit"
                        disabled={creatingSession}
                        className="bg-[#003B71] text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-[#00264d] transition-all disabled:opacity-50 shadow-lg shadow-[#003B71]/10"
                      >
                        {creatingSession ? '...' : 'Create'}
                      </button>
                    </div>
                  </div>
                </form>

                {/* Sessions List */}
                <div className="space-y-4">
                  {sessions.length === 0 ? (
                    <div className="text-center py-12 italic text-slate-400">No sessions created yet.</div>
                  ) : (
                    sessions.map((session, idx) => (
                      <div key={session.id} className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm transition-all">
                        <div 
                          className="p-5 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors"
                          onClick={() => setExpandedSessionId(expandedSessionId === session.id ? null : session.id)}
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-8 h-8 rounded-lg bg-[#003B71]/5 flex items-center justify-center">
                              <span className="text-xs font-black text-[#003B71]">{String(idx + 1).padStart(2, '0')}</span>
                            </div>
                            <div>
                               <h5 className="font-extrabold text-slate-900">{session.title}</h5>
                               {session.description && <p className="text-xs text-slate-400 font-medium">{session.description}</p>}
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <button
                              onClick={(e) => { e.stopPropagation(); handleDeleteSession(session.id); }}
                              className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                            {expandedSessionId === session.id ? (
                              <ChevronUpIcon className="w-5 h-5 text-slate-400" />
                            ) : (
                              <ChevronDownIcon className="w-5 h-5 text-slate-400" />
                            )}
                          </div>
                        </div>

                        {expandedSessionId === session.id && (
                          <div className="p-6 bg-slate-50 border-t border-slate-100 space-y-6">
                            {/* Quick Assignment Actions */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4 border-b border-slate-100">
                              <div className="space-y-2">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Assign Resource</label>
                                <select 
                                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#003B71]/20 outline-none transition-all font-medium"
                                  onChange={(e) => {
                                    if (e.target.value) {
                                      handleAssignResource(session.id, e.target.value)
                                      e.target.value = ''
                                    }
                                  }}
                                  defaultValue=""
                                >
                                  <option value="" disabled>Select from Library...</option>
                                  {globalResources.map(r => (
                                    <option key={r.id} value={r.id}>{r.title} ({r.type})</option>
                                  ))}
                                </select>
                              </div>
                              <div className="space-y-2">
                                <label className="block text-[10px] font-black text-emerald-600 uppercase tracking-widest">Assign Practice Quiz</label>
                                <select 
                                  className="w-full bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all font-medium text-emerald-900"
                                  onChange={(e) => {
                                    if (e.target.value) {
                                      handleAssignPractice(session.id, e.target.value)
                                      e.target.value = ''
                                    }
                                  }}
                                  defaultValue=""
                                >
                                  <option value="" disabled>Select from Transcripts...</option>
                                  {transcripts.map(t => (
                                    <option key={t.id} value={t.id}>{t.title}</option>
                                  ))}
                                </select>
                              </div>
                            </div>

                            {/* Resource Table for Session */}
                            <div className="space-y-2 pt-2">
                              {resources.filter(r => r.session_id === session.id).length === 0 ? (
                                <p className="text-center py-4 text-xs text-slate-400 font-medium italic">No resources attached to this session.</p>
                              ) : (
                                resources.filter(r => r.session_id === session.id).map(res => (
                                  <div key={res.id} className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-xl group transition-all hover:border-[#003B71]/30 hover:shadow-sm">
                                    <div className="flex items-center gap-3">
                                      <div className={`p-1.5 rounded-lg ${
                                        res.type === 'video' ? 'bg-purple-100 text-purple-600' : 
                                        res.type === 'practice' ? 'bg-emerald-100 text-emerald-600' :
                                        'bg-blue-100 text-blue-600'
                                      }`}>
                                        {res.type === 'video' ? <FilmIcon className="w-4 h-4" /> : 
                                         res.type === 'practice' ? <AcademicCapIcon className="w-4 h-4" /> :
                                         res.type === 'document' ? <DocumentTextIcon className="w-4 h-4" /> : 
                                         <LinkIcon className="w-4 h-4" />}
                                      </div>
                                      <div className="flex flex-col">
                                        <span className="text-sm font-bold text-slate-700">{res.title}</span>
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                          {res.type}
                                        </span>
                                      </div>
                                    </div>
                                    <button
                                      onClick={() => handleDeleteResource(res.id)}
                                      className="p-1.5 text-slate-300 hover:text-red-500 transition-colors"
                                      title="Remove from session"
                                    >
                                      <TrashIcon className="w-4 h-4" />
                                    </button>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}
