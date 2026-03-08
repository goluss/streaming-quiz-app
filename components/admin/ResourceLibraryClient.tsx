'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
  DocumentTextIcon, 
  ChevronRightIcon, 
  BeakerIcon, 
  AcademicCapIcon, 
  PlusIcon,
  ArrowPathIcon,
  LinkIcon,
  CloudArrowUpIcon,
  TrashIcon,
  GlobeAltIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'

interface Transcript {
  id: string
  title: string
  created_at: string
  questions: { id: string, is_test: boolean, is_practice: boolean }[]
}

interface GlobalResource {
  id: string
  title: string
  url: string
  type: 'link' | 'document' | 'video'
  file_path?: string
  created_at: string
}

interface Cohort {
  id: string
  name: string
  cohort_sessions: { id: string, title: string }[]
}

interface Question {
  id: string
  question_text: string
  is_test: boolean
  is_practice: boolean
  correct_answer: string
}

interface Props {
  initialTranscripts: Transcript[]
  initialGlobalResources: GlobalResource[]
  cohorts: Cohort[]
}

export default function ResourceLibraryClient({ initialTranscripts, initialGlobalResources, cohorts }: Props) {
  const [activeTab, setActiveTab] = useState<'transcripts' | 'materials'>('transcripts')
  const [transcripts, setTranscripts] = useState<Transcript[]>(initialTranscripts)
  const [globalResources, setGlobalResources] = useState<GlobalResource[]>(initialGlobalResources)
  
  // Selection State
  const [selectedTranscript, setSelectedTranscript] = useState<Transcript | null>(null)
  const [selectedMaterial, setSelectedMaterial] = useState<GlobalResource | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [loadingQuestions, setLoadingQuestions] = useState(false)
  
  // Upload/Form State
  const [uploading, setUploading] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newUrl, setNewUrl] = useState('')
  const [showUploadForm, setShowUploadForm] = useState(false)

  // Assignment State
  const [assigningLoading, setAssigningLoading] = useState(false)
  const [targetCohortId, setTargetCohortId] = useState('')
  const [targetSessionId, setTargetSessionId] = useState('')
  const [sectionTitle, setSectionTitle] = useState('')

  const supabase = createClient()

  // --- TRANSCRIPT ACTIONS ---
  const fetchQuestions = async (transcript: Transcript) => {
    setLoadingQuestions(true)
    setSelectedTranscript(transcript)
    setSelectedMaterial(null)
    const { data } = await supabase
      .from('questions')
      .select('id, question_text, is_test, is_practice, correct_answer')
      .eq('transcript_id', transcript.id)
      .order('created_at', { ascending: true })
    
    setQuestions(data || [])
    setLoadingQuestions(false)
  }

  const toggleFlag = async (questionId: string, field: 'is_test' | 'is_practice', value: boolean) => {
    setQuestions(questions.map(q => q.id === questionId ? { ...q, [field]: value } : q))
    const { error } = await supabase.from('questions').update({ [field]: value }).eq('id', questionId)
    if (error) { alert('Failed to update: ' + error.message); fetchQuestions(selectedTranscript!); }
  }

  // --- GLOBAL MATERIAL ACTIONS ---
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)

    try {
      const fileName = `${Date.now()}-${file.name}`
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('global_resources')
        .upload(fileName, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage.from('global_resources').getPublicUrl(fileName)

      const { data: newRes, error: dbError } = await supabase
        .from('global_resources')
        .insert({
          title: file.name,
          url: publicUrl,
          type: 'document',
          file_path: fileName
        })
        .select()
        .single()

      if (dbError) throw dbError
      setGlobalResources([newRes, ...globalResources])
      setShowUploadForm(false)
    } catch (err: any) {
      alert('Upload failed: ' + err.message)
    } finally {
      setUploading(false)
    }
  }

  const handleAddLink = async () => {
    if (!newTitle || !newUrl) return
    setUploading(true)
    const { data, error } = await supabase
      .from('global_resources')
      .insert({ title: newTitle, url: newUrl, type: 'link' })
      .select()
      .single()
    
    if (error) {
      alert('Failed: ' + error.message)
    } else {
      setGlobalResources([data, ...globalResources])
      setNewTitle(''); setNewUrl(''); setShowUploadForm(false)
    }
    setUploading(false)
  }

  const handleDeleteMaterial = async (id: string, filePath?: string) => {
    if (!confirm('Are you sure you want to delete this resource?')) return
    
    if (filePath) await supabase.storage.from('global_resources').remove([filePath])
    const { error } = await supabase.from('global_resources').delete().eq('id', id)
    
    if (error) alert('Delete failed: ' + error.message)
    else setGlobalResources(globalResources.filter(r => r.id !== id))
  }

  // --- ASSIGNMENT LOGIC ---
  const handleAssign = async () => {
    if (!targetCohortId) return
    setAssigningLoading(true)

    try {
      if (activeTab === 'transcripts' && selectedTranscript) {
        const { error } = await supabase.from('cohort_resources').insert({
          cohort_id: targetCohortId,
          session_id: targetSessionId || null,
          title: `Practice: ${selectedTranscript.title}`,
          type: 'practice',
          transcript_id: selectedTranscript.id,
          section_title: sectionTitle.trim() || null
        })
        if (error) throw error
      } else if (activeTab === 'materials' && selectedMaterial) {
        const { error } = await supabase.from('cohort_resources').insert({
          cohort_id: targetCohortId,
          session_id: targetSessionId || null,
          title: selectedMaterial.title,
          url: selectedMaterial.url,
          type: selectedMaterial.type,
          section_title: sectionTitle.trim() || null
        })
        if (error) throw error
      }
      alert('Successfully assigned!')
    } catch (err: any) {
      alert('Assignment failed: ' + err.message)
    } finally {
      setAssigningLoading(false)
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Sidebar: Navigation & Lists */}
      <div className="lg:col-span-4 space-y-6">
        {/* Tab Switcher */}
        <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200 shadow-inner">
          <button
            onClick={() => setActiveTab('transcripts')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
              activeTab === 'transcripts' ? 'bg-white text-[#003B71] shadow-sm' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <DocumentTextIcon className="w-4 h-4" />
            Transcripts
          </button>
          <button
            onClick={() => setActiveTab('materials')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
              activeTab === 'materials' ? 'bg-white text-[#003B71] shadow-sm' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <GlobeAltIcon className="w-4 h-4" />
            Materials
          </button>
        </div>

        {/* List Content */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-4">
            <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              {activeTab === 'transcripts' ? 'Transcript Library' : 'Global Materials'}
            </h2>
            {activeTab === 'materials' && (
              <button 
                onClick={() => setShowUploadForm(!showUploadForm)}
                className="text-[10px] font-black text-[#003B71] uppercase tracking-widest flex items-center gap-1 hover:underline"
              >
                <PlusIcon className="w-3 h-3" /> Add New
              </button>
            )}
          </div>

          {/* Upload/Link Form */}
          {activeTab === 'materials' && showUploadForm && (
            <div className="bg-[#003B71] p-6 rounded-2xl text-white shadow-xl animate-in slide-in-from-top-4">
              <div className="space-y-4">
                <div>
                  <label className="block text-[8px] font-black uppercase tracking-widest text-white/50 mb-2">Upload File (Doc/Video)</label>
                  <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-white/20 rounded-xl cursor-pointer hover:bg-white/5 transition-all">
                    <CloudArrowUpIcon className="w-6 h-6 text-white/40 mb-2" />
                    <span className="text-[10px] font-bold text-white/60">{uploading ? 'Processing...' : 'Click to Upload'}</span>
                    <input type="file" className="hidden" onChange={handleUpload} disabled={uploading} />
                  </label>
                </div>
                <div className="relative"><div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10"></div></div><div className="relative flex justify-center text-[8px] font-black uppercase tracking-widest"><span className="bg-[#003B71] px-2 text-white/30">Or Add Link</span></div></div>
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="Link Title"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-white/30 outline-none"
                  />
                  <input
                    type="url"
                    placeholder="https://..."
                    value={newUrl}
                    onChange={(e) => setNewUrl(e.target.value)}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-white/30 outline-none"
                  />
                  <button
                    onClick={handleAddLink}
                    disabled={!newTitle || !newUrl || uploading}
                    className="w-full bg-white text-[#003B71] font-black py-2 rounded-lg text-xs hover:bg-slate-50 disabled:opacity-30"
                  >
                    Add Global Link
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm divide-y divide-slate-50">
            {activeTab === 'transcripts' ? (
              transcripts.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs font-bold uppercase tracking-widest">No transcripts yet</div>
              ) : (
                transcripts.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => fetchQuestions(t)}
                    className={`w-full p-5 text-left flex items-center justify-between hover:bg-slate-50 transition-all group ${
                      selectedTranscript?.id === t.id ? 'bg-slate-50 border-l-4 border-[#003B71]' : 'border-l-4 border-transparent'
                    }`}
                  >
                    <div className="min-w-0 pr-4">
                      <p className="font-bold text-slate-900 truncate group-hover:text-[#003B71]">{t.title}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter mt-1">
                        {t.questions.length} Questions • {new Date(t.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <ChevronRightIcon className="w-4 h-4 text-slate-300 group-hover:text-[#003B71]" />
                  </button>
                ))
              )
            ) : (
              globalResources.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs font-bold uppercase tracking-widest">No global materials yet</div>
              ) : (
                globalResources.map((r) => (
                  <div
                    key={r.id}
                    className={`group w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-all ${
                      selectedMaterial?.id === r.id ? 'bg-slate-50 bg-slate-50 border-l-4 border-[#003B71]' : 'border-l-4 border-transparent'
                    }`}
                  >
                    <button
                      onClick={() => { setSelectedMaterial(r); setSelectedTranscript(null); }}
                      className="flex-1 text-left min-w-0 pr-2"
                    >
                      <div className="flex items-center gap-2">
                        {r.type === 'link' ? <LinkIcon className="w-3 h-3 text-amber-500" /> : <DocumentTextIcon className="w-3 h-3 text-blue-500" />}
                        <p className="font-bold text-slate-900 truncate group-hover:text-[#003B71] text-xs">{r.title}</p>
                      </div>
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter mt-1">
                         {r.type} • {new Date(r.created_at).toLocaleDateString()}
                      </p>
                    </button>
                    <button 
                      onClick={() => handleDeleteMaterial(r.id, r.file_path)}
                      className="opacity-0 group-hover:opacity-100 p-2 text-slate-300 hover:text-red-500 transition-all"
                    >
                      <TrashIcon className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )
            )}
          </div>
        </div>
      </div>

      {/* Main Content: Question Management & Assignment */}
      <div className="lg:col-span-8 space-y-8">
        {!selectedTranscript && !selectedMaterial ? (
          <div className="h-full min-h-[400px] border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center text-slate-400 p-8 text-center bg-white/50">
            <GlobeAltIcon className="w-16 h-16 mb-4 opacity-20" />
            <h3 className="text-xl font-bold text-slate-900/40">Select a Resource</h3>
            <p className="max-w-xs mt-2 text-sm font-medium">Select a transcript to manage questions, or a global material to assign it to a group.</p>
          </div>
        ) : (
          <>
            {/* Assignment Panel */}
            <div className="bg-[#003B71] rounded-3xl p-8 text-white shadow-xl shadow-[#003B71]/10">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-black flex items-center gap-3">
                  <PlusIcon className="w-6 h-6" />
                  Assign to Cohort
                </h3>
                <div className="px-3 py-1 bg-white/10 rounded-lg text-[10px] font-black uppercase tracking-widest border border-white/10">
                  {selectedTranscript ? 'Assign Practice Quiz' : 'Assign Resource Material'}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-white/60 mb-2">Select Cohort</label>
                  <select
                    value={targetCohortId}
                    onChange={(e) => { setTargetCohortId(e.target.value); setTargetSessionId(''); }}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-white/30 outline-none"
                  >
                    <option value="" className="text-slate-900">Choose...</option>
                    {cohorts.map(c => <option key={c.id} value={c.id} className="text-slate-900">{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-white/60 mb-2">Assign to Session (Optional)</label>
                  <select
                    value={targetSessionId}
                    onChange={(e) => setTargetSessionId(e.target.value)}
                    disabled={!targetCohortId}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-white/30 outline-none disabled:opacity-30"
                  >
                    <option value="" className="text-slate-900">Whole Cohort (General)</option>
                    {cohorts.find(c => c.id === targetCohortId)?.cohort_sessions?.map((s: { id: string, title: string }) => (
                      <option key={s.id} value={s.id} className="text-slate-900">{s.title}</option>
                    ))}
                  </select>
                </div>
                <div className="lg:col-span-2">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-white/60 mb-2">Section Title (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Whiteboard"
                    value={sectionTitle}
                    onChange={(e) => setSectionTitle(e.target.value)}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-white/30 outline-none"
                  />
                </div>
              </div>
              
              <div className="mt-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-2 text-[10px] font-medium text-white/40">
                  <CheckCircleIcon className="w-3.5 h-3.5 mt-0.5" />
                  <div>
                    <p>This will {selectedTranscript ? 'create a Practice Mode resource' : 'link this document/link'} in the student portal.</p>
                    <p className="mt-1 italic">Tip: Use "Whiteboard" to pin this to the top of the dashboard.</p>
                  </div>
                </div>
                <div className="w-full md:w-48">
                  <button
                    onClick={handleAssign}
                    disabled={!targetCohortId || assigningLoading}
                    className="w-full bg-white text-[#003B71] font-black py-3 rounded-xl hover:bg-slate-50 transition-all disabled:opacity-50 shadow-lg shadow-white/5 active:scale-[0.98]"
                  >
                    {assigningLoading ? 'Assigning...' : selectedTranscript ? 'Add Practice to Cohort' : 'Add to Cohort'}
                  </button>
                </div>
              </div>
            </div>

            {/* Transcript Detail: Question Management */}
            {selectedTranscript && (
              <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
                <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-black text-slate-900 tracking-tight">{selectedTranscript.title}</h3>
                    <p className="text-sm font-medium text-slate-400 mt-1 uppercase tracking-widest">Question Bank Configuration</p>
                  </div>
                  <div className="flex gap-2">
                    <div className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-black uppercase tracking-widest">
                      {questions.filter(q => q.is_test).length} Quiz
                    </div>
                    <div className="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl text-xs font-black uppercase tracking-widest">
                      {questions.filter(q => q.is_practice).length} Practice
                    </div>
                  </div>
                </div>

                {loadingQuestions ? (
                  <div className="p-20 text-center text-slate-400">
                    <ArrowPathIcon className="w-12 h-12 mx-auto animate-spin mb-4 opacity-20" />
                    <p className="font-bold uppercase tracking-widest text-xs">Loading Question Bank...</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 max-h-[800px] overflow-y-auto bg-slate-50/30">
                    {questions.map((q, idx) => (
                      <div key={q.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-white transition-colors group">
                        <div className="flex-1 min-w-0 pr-4">
                          <div className="flex items-center gap-2 mb-1.5">
                             <span className="text-[10px] font-black text-[#003B71]/30">#{String(idx + 1).padStart(2, '0')}</span>
                             <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-[#003B71]/5 text-[#003B71]/50 uppercase">Answer: {q.correct_answer}</span>
                          </div>
                          <p className="text-sm font-bold text-slate-900 group-hover:text-[#003B71] leading-relaxed">{q.question_text}</p>
                        </div>
                        
                        <div className="flex items-center gap-3 shrink-0">
                          <button
                            onClick={() => toggleFlag(q.id, 'is_test', !q.is_test)}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-tighter transition-all border shadow-sm ${
                              q.is_test 
                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-indigo-200' 
                                : 'bg-white text-slate-400 border-slate-200 hover:border-indigo-400 hover:text-indigo-600'
                            }`}
                          >
                            <BeakerIcon className="w-4 h-4" />
                            <span>Include in Quizzes</span>
                          </button>
                          <button
                            onClick={() => toggleFlag(q.id, 'is_practice', !q.is_practice)}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-tighter transition-all border shadow-sm ${
                              q.is_practice 
                                ? 'bg-emerald-600 text-white border-emerald-600 shadow-emerald-200' 
                                : 'bg-white text-slate-400 border-slate-200 hover:border-emerald-400 hover:text-emerald-600'
                            }`}
                          >
                            <AcademicCapIcon className="w-4 h-4" />
                            <span>Include in Practice</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Material Preview */}
            {selectedMaterial && (
              <div className="bg-white border border-slate-200 rounded-3xl p-10 flex flex-col items-center text-center shadow-sm">
                <div className={`p-6 rounded-3xl mb-6 ${
                  selectedMaterial.type === 'link' ? 'bg-amber-50 text-amber-500' : 'bg-blue-50 text-blue-500'
                }`}>
                  {selectedMaterial.type === 'link' ? <LinkIcon className="w-16 h-16" /> : <DocumentTextIcon className="w-16 h-16" />}
                </div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">{selectedMaterial.title}</h3>
                <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-2 mb-8">{selectedMaterial.type} • Added on {new Date(selectedMaterial.created_at).toLocaleDateString()}</p>
                <a 
                  href={selectedMaterial.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="bg-slate-900 text-white px-8 py-3 rounded-xl font-bold text-sm hover:bg-black transition-all shadow-xl shadow-slate-200"
                >
                  Preview Resource
                </a>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
