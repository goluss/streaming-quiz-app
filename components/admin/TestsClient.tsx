'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { PlusIcon, ClipboardDocumentIcon, TrashIcon, ChartBarIcon, XMarkIcon } from '@heroicons/react/24/outline'

interface Transcript {
  id: string
  title: string
}

interface Cohort {
  id: string
  name: string
}

interface Test {
  id: string
  transcript_id: string
  name: string
  code: string
  is_active: boolean
  cohort_id: string | null
  created_at: string
  transcripts?: { title: string }
  cohorts?: { name: string } | { name: string }[] | null
  test_questions?: { question_id: string; questions: { question_text: string } }[]
}

interface Props {
  tests: Test[]
  transcripts: Transcript[]
  cohorts: Cohort[]
  allQuestions: { id: string, question_text: string, transcript_id: string }[]
}

// Generate random 6-character alphanumeric code
function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // removed similar looking chars (1, I, O, 0)
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

export default function TestsClient({ tests: initialTests, transcripts, cohorts, allQuestions }: Props) {
  const [tests, setTests] = useState(initialTests)
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [cohortId, setCohortId] = useState('')
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([])
  const [questionSearch, setQuestionSearch] = useState('')
  const [filterTranscriptId, setFilterTranscriptId] = useState<string>('all')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const supabase = createClient()

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !cohortId || selectedQuestionIds.length === 0) {
      alert('Please provide a name, cohort, and select at least one question.')
      return
    }

    setLoading(true)
    setMessage(null)

    try {
      // Import dynamically at runtime to avoid missing imports at the top
      const { createQuizSecurely } = await import('../../app/admin/tests/actions')
      const result = await createQuizSecurely(name.trim(), cohortId, selectedQuestionIds)

      if (!result.success) {
        setLoading(false)
        setMessage({ type: 'error', text: result.error || 'Failed to construct the quiz.' })
        return
      }

      setTests([result.test, ...tests])
      setName('')
      setCohortId('')
      setSelectedQuestionIds([])
      setShowForm(false)
      setMessage({ type: 'success', text: `Quiz created! Code: ${result.code}` })
    } catch (error: any) {
      setMessage({ type: 'error', text: error?.message || 'A catastrophic error occurred on the frontend.' })
    } finally {
      setLoading(false)
    }
  }

  const filteredQuestions = allQuestions.filter(q => {
    const matchesTranscript = filterTranscriptId === 'all' || q.transcript_id === filterTranscriptId
    const matchesSearch = q.question_text.toLowerCase().includes(questionSearch.toLowerCase())
    return matchesTranscript && matchesSearch
  })

  const toggleSelectAll = () => {
    const allFilteredIds = filteredQuestions.map(q => q.id)
    const allSelected = allFilteredIds.every(id => selectedQuestionIds.includes(id))
    
    if (allSelected) {
      // Deselect all filtered
      setSelectedQuestionIds(selectedQuestionIds.filter(id => !allFilteredIds.includes(id)))
    } else {
      // Select all filtered (avoid duplicates)
      const newSelection = Array.from(new Set([...selectedQuestionIds, ...allFilteredIds]))
      setSelectedQuestionIds(newSelection)
    }
  }

  const handleDelete = async (id: string, code: string) => {
    if (!confirm(`Delete quiz ${code}? Students will no longer be able to take it.`)) return

    const { error } = await supabase.from('tests').delete().eq('id', id)
    if (error) {
      setMessage({ type: 'error', text: error.message })
    } else {
      setTests((prev) => prev.filter((t) => t.id !== id))
    }
  }

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    setMessage({ type: 'success', text: `Code ${code} copied to clipboard!` })
    setTimeout(() => setMessage(null), 3000)
  }

  return (
    <div className="space-y-6">
      {message && (
        <div className={`p-4 rounded-xl border ${message.type === 'error' ? 'bg-red-950/50 border-red-900/50 text-red-400' : 'bg-green-950/50 border-green-900/50 text-green-400'}`}>
          {message.text}
        </div>
      )}

      {/* Header Actions */}
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Quizzes</h1>
          <p className="text-slate-500 mt-1 font-medium">Manage and assign course assessments.</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-[#003B71] text-white px-6 py-3 rounded-xl text-sm font-bold hover:bg-[#00264d] transition-all flex items-center gap-2 shadow-lg shadow-[#003B71]/20"
        >
          <PlusIcon className="w-5 h-5 stroke-[3]" />
          Create New Quiz
        </button>
      </div>

      {/* Creation Form */}
      {showForm && (
        <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-xl relative overflow-hidden transition-all animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-[#003B71]" />
          <h3 className="text-xl font-black text-slate-900">Create New Quiz</h3>
          
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-xs font-extrabold text-[#003B71] uppercase tracking-widest mb-2 ml-1">Quiz Name (e.g. "Week 1 Quiz")</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:border-[#003B71] focus:ring-1 focus:ring-[#003B71] font-medium transition-all"
                placeholder="Name this assignment..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-2">
              <div>
                <label className="block text-xs font-extrabold text-[#003B71] uppercase tracking-widest mb-2 ml-1">Target Cohort</label>
                <select
                    required
                    value={cohortId}
                    onChange={(e) => setCohortId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:border-[#003B71] font-medium transition-all"
                >
                    <option value="" disabled>Select a cohort...</option>
                    {cohorts.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-[#003B71] uppercase tracking-widest mb-2 ml-1">Filter by Source Transcript</label>
                <select
                  value={filterTranscriptId}
                  onChange={(e) => setFilterTranscriptId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:border-[#003B71] font-medium transition-all"
                >
                  <option value="all">All Transcripts</option>
                  {transcripts.map(t => (
                    <option key={t.id} value={t.id}>{t.title}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2 ml-1">
                <div className="flex items-center gap-4">
                  <label className="block text-xs font-extrabold text-[#003B71] uppercase tracking-widest">Select Questions ({selectedQuestionIds.length} chosen)</label>
                  <button
                    type="button"
                    onClick={toggleSelectAll}
                    className="text-[10px] font-black text-[#003B71] uppercase tracking-widest hover:underline"
                  >
                    {filteredQuestions.every(q => selectedQuestionIds.includes(q.id)) ? 'Deselect All' : 'Select All Filtered'}
                  </button>
                </div>
                <input 
                    type="text"
                    placeholder="Search questions..."
                    value={questionSearch}
                    onChange={(e) => setQuestionSearch(e.target.value)}
                    className="text-[10px] bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-slate-900 focus:ring-1 focus:ring-[#003B71] w-32 md:w-48 outline-none"
                />
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-xl max-h-60 overflow-y-auto divide-y divide-slate-100 custom-scrollbar">
                {filteredQuestions.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 text-[10px] font-bold uppercase tracking-widest italic">No matching questions</div>
                ) : (
                    filteredQuestions.map(q => (
                        <label key={q.id} className="flex items-start gap-3 p-4 hover:bg-white cursor-pointer transition-colors group">
                           <input 
                             type="checkbox"
                             checked={selectedQuestionIds.includes(q.id)}
                             onChange={(e) => {
                               if (e.target.checked) setSelectedQuestionIds([...selectedQuestionIds, q.id])
                               else setSelectedQuestionIds(selectedQuestionIds.filter(id => id !== q.id))
                             }}
                             className="mt-0.5 w-4 h-4 rounded border-slate-300 text-[#003B71] focus:ring-[#003B71] transition-all"
                           />
                           <span className={`text-[13px] font-bold leading-relaxed transition-colors ${selectedQuestionIds.includes(q.id) ? 'text-[#003B71]' : 'text-slate-500 group-hover:text-slate-700'}`}>
                             {q.question_text}
                           </span>
                        </label>
                    ))
                )}
              </div>
              <div className="flex items-center gap-2 mt-4 p-3 bg-amber-50 border border-amber-100 rounded-xl">
                <svg className="w-4 h-4 text-amber-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-[10px] text-amber-700 font-bold uppercase tracking-tight">
                  Remember: Students will see 5 random questions from this pool for their quiz.
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100">
              <button
                type="submit"
                disabled={loading || selectedQuestionIds.length === 0 || !name.trim() || !cohortId}
                className="bg-[#003B71] hover:bg-[#00264d] disabled:opacity-50 disabled:cursor-not-allowed text-white px-8 py-3 rounded-xl text-sm font-bold transition-all shadow-md active:scale-95"
              >
                {loading ? 'Creating Quiz...' : 'Create Quiz'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* List */}
      {tests.length === 0 ? (
        <div className="text-center py-24 text-slate-500 border border-slate-800 border-dashed rounded-2xl">
          <p className="font-medium">No active quizzes</p>
          <p className="text-sm mt-1">Create one to get a 6-digit access code for students.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {tests.map((t) => (
            <div key={t.id} className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-[#003B71]/30 transition-all shadow-sm group">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1">
                  <Link
                    href={`/admin/tests/${t.id}`}
                    className="font-bold text-lg text-slate-900 hover:text-[#003B71] transition-colors truncate"
                  >
                    {t.name}
                  </Link>
                  {t.cohorts && (
                    <span className="shrink-0 px-2 py-0.5 text-[9px] font-black uppercase tracking-widest bg-slate-100 text-slate-500 border border-slate-200 rounded-lg">
                      {Array.isArray(t.cohorts) ? t.cohorts[0]?.name : t.cohorts.name}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 font-medium truncate">
                  Source: {t.transcripts?.title || 'Unknown Transcript'}
                </p>
              </div>

              {/* Questions Summary */}
              <div className="flex items-center gap-4 bg-slate-50 px-4 py-3 rounded-xl border border-slate-100 shrink-0">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Questions Pool</span>
                  <span className="text-sm font-bold text-slate-700">{t.test_questions?.length ?? 0} Items</span>
                </div>
                <div className="w-px h-8 bg-slate-200" />
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Quiz Length</span>
                  <span className="text-sm font-bold text-emerald-700">5 Questions</span>
                </div>
                <button 
                  onClick={() => {
                    // Redirect to analytics or detail
                  }}
                  className="ml-2 p-2 text-slate-400 hover:text-[#003B71] hover:bg-white rounded-lg transition-all"
                  title="Manage Questions"
                >
                  <PlusIcon className="w-4 h-4" />
                </button>
              </div>
              
              <div className="flex items-center gap-8 shrink-0">
                <div className="flex flex-col items-end">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Access Code</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-mono font-black text-[#003B71] tracking-widest">{t.code}</span>
                    <button
                      onClick={() => copyCode(t.code)}
                      className="p-1.5 text-slate-300 hover:text-[#003B71] transition-colors"
                      title="Copy Code"
                    >
                      <ClipboardDocumentIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2 border-l border-slate-100 pl-6">
                  <Link
                    href={`/admin/tests/${t.id}`}
                    className="p-2.5 bg-white text-slate-400 hover:text-[#003B71] hover:bg-slate-50 border border-slate-100 rounded-xl transition-all shadow-sm"
                    title="View Analytics"
                  >
                    <ChartBarIcon className="w-5 h-5" />
                  </Link>
                  <button
                    onClick={() => handleDelete(t.id, t.code)}
                    className="p-2.5 bg-white text-slate-400 hover:text-red-500 hover:bg-red-50 border border-slate-100 rounded-xl transition-all shadow-sm"
                    title="Delete Quiz"
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
