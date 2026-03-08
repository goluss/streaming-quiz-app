'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { PencilSquareIcon, CheckIcon, XMarkIcon, TrashIcon, PlusIcon } from '@heroicons/react/24/outline'

interface Question {
  id: string
  transcript_id: string | null
  question_text: string
  options: { label: string; text: string }[]
  correct_answer: string
  category: string | null
  is_practice: boolean
  transcripts?: { title: string } | { title: string }[] | null
}

const CATEGORIES = ['General', 'Safety', 'Compliance', 'Technical', 'Procedures', 'Other']

export default function QuestionsClient({ 
  questions: initialQuestions,
  tests,
  transcripts
}: { 
  questions: Question[],
  tests: { id: string, name: string }[],
  transcripts: { id: string, title: string }[]
}) {
  const [questions, setQuestions] = useState(initialQuestions)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editCategory, setEditCategory] = useState('')
  const [editText, setEditText] = useState('')
  const [editOptions, setEditOptions] = useState<{label: string, text: string}[]>([])
  const [editCorrectAnswer, setEditCorrectAnswer] = useState('')
  const [editIsPractice, setEditIsPractice] = useState(false)
  const [editTranscriptId, setEditTranscriptId] = useState('')
  const [selectedTranscriptId, setSelectedTranscriptId] = useState<string>('all')

  const [saving, setSaving] = useState(false)
  const [filter, setFilter] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([])
  const [targetTestId, setTargetTestId] = useState('')
  const [bulkAssigning, setBulkAssigning] = useState(false)
  
  const supabase = createClient()

  const startEdit = (q: Question) => {
    setEditingId(q.id)
    setEditCategory(q.category ?? '')
    setEditText(q.question_text)
    // Deep copy options so we can edit them freely
    setEditOptions(q.options.map(o => ({...o})))
    setEditCorrectAnswer(q.correct_answer)
    setEditIsPractice(q.is_practice)
    setEditTranscriptId(q.transcript_id || '')
  }

  const saveEdit = async (id: string) => {
    setSaving(true)
    const { error } = await supabase
      .from('questions')
      .update({ 
        category: editCategory || null, 
        question_text: editText,
        options: editOptions,
        correct_answer: editCorrectAnswer,
        is_practice: editIsPractice,
        transcript_id: editTranscriptId || null
      })
      .eq('id', id)

    if (!error) {
      setQuestions(questions.map((q) =>
        q.id === id ? { 
          ...q, 
          category: editCategory || null, 
          question_text: editText,
          options: editOptions,
          correct_answer: editCorrectAnswer,
          is_practice: editIsPractice,
          transcript_id: editTranscriptId || null
        } : q
      ))
    }
    setEditingId(null)
    setSaving(false)
  }


  const deleteQuestion = async (id: string) => {
    if (!window.confirm('Are you sure you want to permanently delete this question?')) return
    
    const { error } = await supabase.from('questions').delete().eq('id', id)
    if (!error) {
      setQuestions((prev) => prev.filter((q) => q.id !== id))
    } else {
      alert('Failed to delete question: ' + error.message)
    }
  }

  const filtered = questions.filter((q) => {
    const transcriptMatch = selectedTranscriptId === 'all' || q.transcript_id === selectedTranscriptId
    const transcript = Array.isArray(q.transcripts) ? q.transcripts[0] : q.transcripts
    const title = transcript?.title || ''
    const searchMatch = !searchTerm || 
      title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      q.question_text.toLowerCase().includes(searchTerm.toLowerCase())
    return transcriptMatch && searchMatch
  })

  const toggleSelection = (id: string) => {
    setSelectedQuestions(prev => prev.includes(id) ? prev.filter(qId => qId !== id) : [...prev, id])
  }

  const toggleAll = () => {
    if (selectedQuestions.length === filtered.length && filtered.length > 0) {
      setSelectedQuestions([])
    } else {
      setSelectedQuestions(filtered.map(q => q.id))
    }
  }

  const handleBulkAssign = async () => {
    if (!targetTestId) {
      alert("Please select a valid test.")
      return
    }

    if (selectedQuestions.length === 0) return

    setBulkAssigning(true)
    const rows = selectedQuestions.map(question_id => ({
      test_id: targetTestId,
      question_id
    }))

    const { error } = await supabase.from('test_questions').insert(rows)

    if (error) {
      // In Postgres, if any duplicate fails, the whole insert might fail, or might fail partially handled by user configuration.
      // Usually users will just want to know.
      if (error.code === '23505') {
        alert("Some or all of these questions are already in this test.")
      } else {
        alert("Error assigning questions: " + error.message)
      }
    } else {
      alert(`Success! Assigned ${selectedQuestions.length} questions to the test.`)
      setSelectedQuestions([])
      setTargetTestId('')
    }
    
    setBulkAssigning(false)
  }

  return (
    <div className="max-w-5xl space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Question Bank</h1>
          <p className="text-slate-500 font-medium mt-2">
            {questions.length} questions total • Manage and categorize your assessment pool
          </p>
        </div>
        <div className="flex-1 max-w-2xl flex gap-3">
          <select
            value={selectedTranscriptId}
            onChange={(e) => setSelectedTranscriptId(e.target.value)}
            className="w-48 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-[#003B71] focus:outline-none focus:border-[#003B71] transition-all"
          >
            <option value="all">All Transcripts</option>
            {transcripts.map(t => (
              <option key={t.id} value={t.id}>{t.title}</option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Search by transcript title or question text..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#003B71] transition-all"
          />
        </div>
      </div>

      {/* Bulk Action Bar */}
      {selectedQuestions.length > 0 && (
        <div className="bg-indigo-50 border border-indigo-200 p-4 rounded-xl shadow-sm flex flex-wrap items-center justify-between gap-4 animate-in fade-in slide-in-from-bottom-2">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm">
              {selectedQuestions.length}
            </div>
            <span className="font-semibold text-indigo-900">Questions Selected</span>
            <button onClick={() => setSelectedQuestions([])} className="text-xs font-bold text-indigo-400 hover:text-indigo-600 ml-2">Clear</button>
          </div>
          <div className="flex items-center gap-3 flex-1 max-w-sm ml-auto">
            <select
              value={targetTestId}
              onChange={(e) => setTargetTestId(e.target.value)}
              className="flex-1 bg-white border border-indigo-200 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 focus:outline-none focus:border-indigo-500"
            >
              <option value="" disabled>Select Target Quiz...</option>
              {tests.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
            <button
              onClick={handleBulkAssign}
              disabled={bulkAssigning || !targetTestId}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-5 py-2 rounded-lg font-bold text-sm shadow-sm transition-all"
            >
              {bulkAssigning ? 'Assigning...' : 'Assign to Quiz'}
            </button>
          </div>
        </div>
      )}

      {/* Select All Toggle */}
      {filtered.length > 0 && (
        <div className="flex items-center gap-2 px-2 print:hidden">
          <input 
            type="checkbox" 
            checked={selectedQuestions.length === filtered.length && filtered.length > 0} 
            onChange={toggleAll}
            className="w-4 h-4 rounded text-[#003B71] focus:ring-[#003B71] border-slate-300"
          />
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider cursor-pointer select-none" onClick={toggleAll}>
            Select All ({filtered.length})
          </span>
        </div>
      )}

      {/* List Container */}
      <div className="space-y-4">

        {filtered.length === 0 ? (
          <div className="text-center py-24 bg-white border border-slate-200 border-dashed rounded-2xl">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
              <PlusIcon className="w-8 h-8 text-slate-200" />
            </div>
            <p className="font-bold text-slate-400 uppercase tracking-widest text-xs">No questions found in this view</p>
          </div>
        ) : (
          filtered.map((q, idx) => (
            <div key={q.id} className="sg-card p-0 overflow-hidden group">
              {editingId === q.id ? (
                /* Edit Mode Card */
                <div className="p-8 space-y-6 relative overflow-hidden">
                   <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-500" />
                   <div className="flex justify-between items-center mb-2">
                     <h3 className="text-xs font-black text-amber-600 uppercase tracking-[0.2em]">Quick Edit Mode</h3>
                     <span className="text-[10px] font-bold text-slate-300">ID: {q.id.substring(0,8)}</span>
                   </div>
                   
                  <textarea
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    rows={2}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-amber-500 font-medium resize-none transition-all"
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {editOptions.map((opt, oIdx) => (
                      <div key={opt.label} className="relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-3">
                          <input 
                            type="radio" 
                            name={`correct-${q.id}`} 
                            checked={editCorrectAnswer === opt.label}
                            onChange={() => setEditCorrectAnswer(opt.label)}
                            className="w-4 h-4 text-amber-500 focus:ring-amber-500 bg-white border-slate-200"
                          />
                          <span className={`text-xs font-black ${editCorrectAnswer === opt.label ? 'text-amber-600' : 'text-slate-400'}`}>
                            {opt.label}
                          </span>
                        </div>
                        <input
                          type="text"
                          value={opt.text}
                          onChange={(e) => {
                            const newOpts = [...editOptions]
                            newOpts[oIdx].text = e.target.value
                            setEditOptions(newOpts)
                          }}
                          className={`w-full pl-16 pr-4 py-3 bg-white border rounded-xl text-sm text-slate-900 focus:outline-none font-medium transition-all ${
                            editCorrectAnswer === opt.label ? 'border-amber-500 ring-1 ring-amber-500/10' : 'border-slate-200 focus:border-slate-300'
                          }`}
                        />
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-wrap items-center gap-6">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id={`edit-is-practice-${q.id}`}
                        checked={editIsPractice}
                        onChange={(e) => setEditIsPractice(e.target.checked)}
                        className="w-5 h-5 rounded text-amber-500 focus:ring-amber-500 border-slate-300"
                      />
                      <label htmlFor={`edit-is-practice-${q.id}`} className="text-sm font-bold text-slate-700 cursor-pointer">Available for Practice</label>
                    </div>

                    <div className="flex-1 min-w-[200px]">
                      <select
                        value={editTranscriptId}
                        onChange={(e) => setEditTranscriptId(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-medium focus:border-amber-500 outline-none"
                      >
                        <option value="">No Transcript Link</option>
                        {transcripts.map(t => (
                          <option key={t.id} value={t.id}>Source: {t.title}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center justify-end pt-6 border-t border-slate-100">
                      <button
                        onClick={() => setEditingId(null)}
                        className="px-6 py-2.5 text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => saveEdit(q.id)}
                        disabled={saving}
                        className="flex items-center gap-2 px-8 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold rounded-xl transition-all shadow-md"
                      >
                        <CheckIcon className="w-5 h-5 stroke-[2.5]" />
                        {saving ? 'Updating...' : 'Update Question'}
                      </button>
                    </div>
                </div>
              ) : (
                /* View Mode Card */
                <div className="flex flex-col md:flex-row relative">
                  
                  {/* Selection Checkbox */}
                  <div className="absolute top-4 left-4 z-10 md:static md:p-6 md:pr-0 md:flex md:items-start md:mt-2">
                    <input 
                      type="checkbox" 
                      checked={selectedQuestions.includes(q.id)}
                      onChange={() => toggleSelection(q.id)}
                      className="w-5 h-5 rounded text-[#003B71] focus:ring-[#003B71] border-slate-300 cursor-pointer shadow-sm"
                    />
                  </div>

                  <div className="flex-1 p-8 pl-12 md:pl-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-slate-50 border border-slate-100 text-[10px] font-black text-slate-400">
                        {idx + 1}
                      </div>
                      {(() => {
                        const t = Array.isArray(q.transcripts) ? q.transcripts[0] : q.transcripts
                        return t?.title ? (
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter truncate max-w-[200px]">
                            Source: {t.title}
                          </span>
                        ) : null
                      })()}
                    </div>
                    
                    <p className="text-lg font-bold text-slate-900 leading-snug mb-6">{q.question_text}</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {q.options.map((opt) => (
                        <div
                          key={opt.label}
                          className={`flex items-center gap-3 px-5 py-3.5 rounded-xl border text-sm font-medium transition-all ${
                            opt.label === q.correct_answer
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-100 shadow-sm'
                              : 'bg-slate-50/50 text-slate-500 border-slate-100/50'
                          }`}
                        >
                          <span className={`flex items-center justify-center w-6 h-6 rounded-md text-[10px] font-black ${
                            opt.label === q.correct_answer ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500'
                          }`}>
                            {opt.label}
                          </span>
                          <span className="truncate">{opt.text}</span>
                          {opt.label === q.correct_answer && (
                            <CheckIcon className="w-4 h-4 ml-auto text-emerald-500 stroke-[3]" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Actions Sidebar */}
                  <div className="bg-slate-50 border-t md:border-t-0 md:border-l border-slate-100 p-4 md:flex-col flex flex-row items-center justify-center gap-2 md:w-16">
                    <button
                      onClick={() => startEdit(q)}
                      className="p-3 text-slate-400 hover:text-[#003B71] hover:bg-white hover:shadow-sm rounded-xl transition-all active:scale-95"
                      title="Edit question"
                    >
                      <PencilSquareIcon className="w-5 h-5 stroke-[2]" />
                    </button>
                    <button
                      onClick={() => deleteQuestion(q.id)}
                      className="p-3 text-slate-400 hover:text-red-500 hover:bg-white hover:shadow-sm rounded-xl transition-all active:scale-95"
                      title="Delete question permanently"
                    >
                      <TrashIcon className="w-5 h-5 stroke-[2]" />
                    </button>

                    <div className="md:mt-4 md:border-t border-slate-100 md:pt-4 flex flex-col items-center gap-2">
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-tighter hidden md:block">Add to Quiz</p>
                      <select
                        onChange={async (e) => {
                          const testId = e.target.value
                          if (!testId) return
                          const { error } = await supabase.from('test_questions').insert({ test_id: testId, question_id: q.id })
                          if (error) {
                            if (error.code === '23505') alert('Question is already in this test.')
                            else alert('Error: ' + error.message)
                          } else {
                            alert('Added to test!')
                          }
                          e.target.value = ''
                        }}
                        className="p-1.5 md:w-10 bg-white border border-slate-200 rounded-lg text-[10px] font-bold text-slate-500 hover:border-indigo-400 focus:outline-none transition-all"
                      >
                        <option value="">+</option>
                        {tests.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
