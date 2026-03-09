'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { PlusIcon, UserGroupIcon, ChartBarSquareIcon, TrashIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'

interface Cohort {
  id: string
  name: string
  invite_code: string
  whiteboard_url?: string | null
  created_at: string
  student_cohorts?: [{ count: number }] | { count: number }
}

interface Props {
  initialCohorts: any[]
}

export default function CohortsClient({ initialCohorts }: Props) {
  const [cohorts, setCohorts] = useState<Cohort[]>(initialCohorts)
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [whiteboardUrl, setWhiteboardUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const supabase = createClient()
  
  const generateCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let result = ''
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    setLoading(true)
    setMessage(null)

    const inviteCode = generateCode()

    const { data, error } = await supabase
      .from('cohorts')
      .insert({ 
        name: name.trim(), 
        invite_code: inviteCode,
        whiteboard_url: whiteboardUrl.trim() || null
      })
      .select('id, name, invite_code, whiteboard_url, created_at')
      .single()

    setLoading(false)

    if (error) {
      setMessage({ type: 'error', text: error.message || 'Failed to create cohort' })
    } else {
      // Initialize student_cohorts count to 0 for UI purposes
      setCohorts([{ ...data, student_cohorts: { count: 0 } }, ...cohorts])
      setName('')
      setShowForm(false)
      setMessage({ type: 'success', text: 'Cohort created successfully!' })
    }
  }
  
  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete the cohort "${name}"? This will unassign all students from this cohort.`)) {
      return
    }

    setDeletingId(id)
    setMessage(null)

    const { error } = await supabase
      .from('cohorts')
      .delete()
      .eq('id', id)

    setDeletingId(null)

    if (error) {
      console.error('Error deleting cohort:', error)
      setMessage({ type: 'error', text: error.message || 'Failed to delete cohort' })
    } else {
      setCohorts(cohorts.filter(c => c.id !== id))
      setMessage({ type: 'success', text: 'Cohort deleted successfully' })
    }
  }

  const getCount = (p: any) => {
    if (!p) return 0
    if (Array.isArray(p)) return p[0]?.count || 0
    return p.count || 0
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Active Cohorts</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-[#003B71] hover:bg-[#00264d] text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm flex items-center gap-2 active:scale-95"
        >
          <PlusIcon className="w-5 h-5 stroke-[2.5]" />
          Create New Cohort
        </button>
      </div>

      {message && (
        <div className={`p-4 rounded-xl text-sm font-semibold border ${
          message.type === 'error' 
            ? 'bg-red-50 border-red-100 text-red-600' 
            : 'bg-emerald-50 border-emerald-100 text-emerald-600'
        }`}>
          {message.text}
        </div>
      )}

      {showForm && (
        <form onSubmit={handleCreate} className="bg-white border border-slate-200 rounded-2xl p-8 shadow-xl relative overflow-hidden transition-all animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-[#003B71]" />
          <h3 className="text-lg font-bold text-slate-900 mb-6">New Cohort Details</h3>
          
          <div className="space-y-6 max-w-xl">
            <div>
              <label className="block text-xs font-extrabold text-[#003B71] uppercase tracking-widest mb-2">Cohort Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:border-[#003B71] focus:ring-1 focus:ring-[#003B71] font-medium transition-all"
                placeholder="e.g. Sales Onboarding Q3 2024"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold text-[#003B71] uppercase tracking-widest mb-2">Whiteboard URL (Optional)</label>
              <input
                type="url"
                value={whiteboardUrl}
                onChange={(e) => setWhiteboardUrl(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:border-[#003B71] focus:ring-1 focus:ring-[#003B71] font-medium transition-all"
                placeholder="https://miro.com/..."
              />
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-6 py-2.5 text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !name.trim()}
                className="bg-[#003B71] hover:bg-[#00264d] disabled:opacity-50 disabled:cursor-not-allowed text-white px-8 py-2.5 rounded-xl text-sm font-bold transition-all shadow-md active:scale-95"
              >
                {loading ? 'Creating...' : 'Launch Cohort'}
              </button>
            </div>
          </div>
        </form>
      )}

      {cohorts.length === 0 ? (
        <div className="text-center py-20 bg-white border border-slate-200 rounded-2xl border-dashed">
          <UserGroupIcon className="w-16 h-16 text-slate-200 mx-auto mb-4" />
          <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">No cohorts created yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {cohorts.map((cohort) => (
            <div key={cohort.id} className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-[#003B71]/30 transition-all shadow-sm group">
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold text-slate-900 group-hover:text-[#003B71] transition-colors mb-1 truncate">{cohort.name}</h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Created {new Date(cohort.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              </div>

              <div className="flex items-center gap-8 shrink-0">
                <div className="flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
                  <div className="p-1.5 bg-indigo-50 rounded-lg">
                    <UserGroupIcon className="w-4 h-4 text-indigo-600" />
                  </div>
                  <span className="text-xs font-bold text-slate-700">
                    {getCount(cohort.student_cohorts)} <span className="text-slate-400 font-medium">Students</span>
                  </span>
                </div>

                <div className="flex flex-col items-center px-4 border-l border-slate-100 min-w-[120px]">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Invite Code</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black text-[#003B71] tracking-widest uppercase">{cohort.invite_code}</span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(cohort.invite_code)
                        alert(`Copied code: ${cohort.invite_code}`)
                      }}
                      className="text-slate-300 hover:text-[#003B71] transition-colors"
                      title="Copy code"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 0 1-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H9.75" />
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2 border-l border-slate-100 pl-6">
                  <Link
                    href={`/admin/cohorts/${cohort.id}`}
                    className="flex items-center gap-2 px-5 py-2.5 bg-[#003B71] hover:bg-[#00264d] text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-md active:scale-95"
                  >
                    <ChartBarSquareIcon className="w-4 h-4 stroke-[2.5]" />
                    Portal
                  </Link>
                  <button
                    onClick={() => handleDelete(cohort.id, cohort.name)}
                    disabled={deletingId === cohort.id}
                    className="p-2.5 bg-white text-slate-300 hover:text-red-500 hover:bg-red-50 border border-slate-200 rounded-xl transition-all shadow-sm active:scale-95 disabled:opacity-50"
                    title="Delete Cohort"
                  >
                    <TrashIcon className={`w-5 h-5 ${deletingId === cohort.id ? 'animate-pulse' : ''}`} />
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
