'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { joinCohortSecurely } from '@/app/setup-profile/actions'

export default function CohortJoin() {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault()
    const cleanCode = code.trim().toUpperCase()
    if (cleanCode.length !== 6) {
      setError('Invite code must be 6 characters.')
      return
    }

    setLoading(true)
    setError(null)
    
    // Get current user id securely
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
        setError('You must be logged in to join a cohort.')
        setLoading(false)
        return
    }

    const result = await joinCohortSecurely(user.id, null, cleanCode)

    if (!result.success) {
      setError(result.error || 'Failed to join cohort. Please check the code.')
      setLoading(false)
      return
    }

    router.push('/student')
    router.refresh()
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-sm">
      <h2 className="text-xl font-bold text-slate-900 mb-2">Join a Training Cohort</h2>
      <p className="text-sm text-slate-500 mb-6">Enter the 6-character invite code provided by your instructor to join a new class.</p>
      
      <form onSubmit={handleJoin} className="flex gap-3">
        <input
          type="text"
          placeholder="e.g. A1B2C3"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 font-bold tracking-widest focus:ring-2 focus:ring-[#003B71]/20 focus:border-[#003B71] outline-none transition-all uppercase placeholder:font-normal placeholder:tracking-normal"
          maxLength={6}
        />
        <button
          type="submit"
          disabled={loading || code.trim().length !== 6}
          className="bg-[#003B71] hover:bg-[#00264d] text-white px-6 py-3 rounded-xl font-bold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap shadow-md active:scale-95"
        >
          {loading ? 'Joining...' : 'Join Class'}
        </button>
      </form>
      {error && <p className="mt-3 text-xs text-red-500 font-bold">{error}</p>}
    </div>
  )
}
