'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { DocumentPlusIcon, CloudArrowUpIcon, TrashIcon, BeakerIcon } from '@heroicons/react/24/outline'

interface Transcript {
  id: string
  title: string
  content: string
  created_at: string
}

interface Props {
  transcripts: Transcript[]
}

export default function TranscriptsClient({ transcripts: initialTranscripts }: Props) {
  const [transcripts, setTranscripts] = useState(initialTranscripts)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [loadingStep, setLoadingStep] = useState<'uploading' | 'generating' | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleDeleteTranscript = async (id: string, title: string) => {
    if (!confirm(`Delete "${title}" and all its questions? This cannot be undone.`)) return
    const { error } = await supabase.from('transcripts').delete().eq('id', id)
    if (error) {
      setMessage({ type: 'error', text: error.message })
    } else {
      setTranscripts((prev) => prev.filter((t) => t.id !== id))
      setMessage({ type: 'success', text: `"${title}" and its questions deleted.` })
    }
  }

  const handleClearAll = async () => {
    if (!confirm('⚠️ Delete ALL transcripts and ALL questions? This cannot be undone.')) return
    if (!confirm('Are you absolutely sure? All student question data will be lost.')) return
    setDeleting(true)
    // Delete all transcripts — questions cascade via FK
    const { error } = await supabase.from('transcripts').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    if (error) {
      setMessage({ type: 'error', text: error.message })
    } else {
      setTranscripts([])
      setMessage({ type: 'success', text: 'All transcripts and questions cleared.' })
    }
    setDeleting(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !content.trim()) return

    setLoadingStep('uploading')
    setMessage(null)

    const { data: { user } } = await supabase.auth.getUser()
    const { data, error } = await supabase
      .from('transcripts')
      .insert({ title: title.trim(), content: content.trim(), created_by: user?.id })
      .select()
      .single()

    if (error) {
      setMessage({ type: 'error', text: error.message })
      setLoadingStep(null)
      return
    }

    // Transcript saved — now generate questions via AI
    setLoadingStep('generating')
    setTranscripts([data, ...transcripts])

    try {
      const res = await fetch('/api/generate-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcriptId: data.id, content: data.content, title: data.title }),
      })
      const result = await res.json()

      if (!res.ok) throw new Error(result.error ?? 'Generation failed')

      setMessage({
        type: 'success',
        text: `✅ "${data.title}" uploaded! ${result.count} questions generated successfully.`,
      })
    } catch (err) {
      setMessage({
        type: 'error',
        text: `Transcript saved but question generation failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
      })
    }

    setTitle('')
    setContent('')
    setShowForm(false)
    setLoadingStep(null)
  }


  return (
    <div className="max-w-5xl space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Transcripts</h1>
          <p className="text-slate-500 font-medium mt-2">Upload training content to generate assessment questions</p>
        </div>
        <button
          id="new-transcript-btn"
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-6 py-3 bg-[#003B71] hover:bg-[#00264d] text-white font-bold rounded-xl transition-all shadow-md active:scale-95"
        >
          <DocumentPlusIcon className="w-5 h-5 stroke-[2.5]" />
          Upload Transcript
        </button>
      </div>

      {/* Feedback Message */}
      {message && (
        <div className={`p-4 rounded-xl border text-sm font-semibold transition-all animate-in fade-in slide-in-from-top-2 ${
          message.type === 'success'
            ? 'bg-emerald-50 border-emerald-100 text-emerald-600'
            : 'bg-red-50 border-red-100 text-red-600'
        }`}>
          {message.text}
        </div>
      )}

      {/* Upload Form */}
      {showForm && (
        <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-xl relative overflow-hidden transition-all animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-[#003B71]" />
          <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-3">
            <CloudArrowUpIcon className="w-6 h-6 text-[#003B71]" />
            New Transcript
          </h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-xs font-extrabold text-[#003B71] uppercase tracking-widest mb-2 ml-1">Title</label>
              <input
                id="transcript-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Leadership Workshop - Module 1"
                required
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#003B71] focus:ring-1 focus:ring-[#003B71] font-medium transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-extrabold text-[#003B71] uppercase tracking-widest mb-2 ml-1">
                Transcript Content
                <span className="text-slate-400 font-bold ml-2">({content.length.toLocaleString()} characters)</span>
              </label>
              <textarea
                id="transcript-content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Paste your full training transcript here..."
                required
                rows={10}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#003B71] focus:ring-1 focus:ring-[#003B71] font-medium transition-all resize-none font-mono leading-relaxed"
              />
            </div>
            <div className="flex gap-3 justify-end pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-6 py-2.5 text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors"
              >
                Cancel
              </button>
              <button
                id="upload-transcript-submit"
                type="submit"
                disabled={!!loadingStep}
                className="px-8 py-2.5 bg-[#003B71] hover:bg-[#00264d] disabled:opacity-50 text-white text-sm font-bold rounded-xl transition-all shadow-md active:scale-95"
              >
                {loadingStep === 'uploading' ? 'Uploading…'
                  : loadingStep === 'generating' ? '🤖 Generating questions…'
                  : 'Process & Generate Questions'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Transcripts List */}
      {transcripts.length === 0 ? (
        <div className="text-center py-20 bg-white border border-slate-200 rounded-2xl border-dashed">
          <DocumentPlusIcon className="w-16 h-16 text-slate-100 mx-auto mb-4" />
          <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No transcripts uploaded yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {transcripts.map((t) => (
            <div
              key={t.id}
              className="sg-card p-6 md:p-8 hover:border-[#003B71]/30 transition-all group"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-bold text-slate-900 text-lg group-hover:text-[#003B71] transition-colors truncate">{t.title}</h3>
                    <span className="px-2.5 py-0.5 bg-slate-100 text-slate-500 text-[10px] font-black uppercase tracking-widest rounded-md border border-slate-200">
                      {t.content.length.toLocaleString()} chars
                    </span>
                  </div>
                  <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-4">
                    Added {new Date(t.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                  <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed italic pr-4">"{t.content.substring(0, 150)}..."</p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <button
                    onClick={() => router.push(`/admin/questions?transcript=${t.id}`)}
                    className="px-5 py-2.5 bg-[#003B71] hover:bg-[#00264d] text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-sm active:scale-95"
                  >
                    Manage Qs
                  </button>
                  <button
                    onClick={() => handleDeleteTranscript(t.id, t.title)}
                    className="p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all active:scale-95"
                    title="Delete transcript and its questions"
                  >
                    <TrashIcon className="w-5 h-5 stroke-[2]" />
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
