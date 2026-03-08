'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowRightIcon } from '@heroicons/react/24/outline'
import { verifyTestCode } from '@/app/student/tests/actions'

export default function TestCodeEntry() {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleStartTest = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Normalize code (uppercase, strip whitespace)
    const cleanCode = code.trim().toUpperCase()
    if (cleanCode.length !== 6) {
      setError('Quiz code must be exactly 6 characters.')
      return
    }

    setLoading(true)
    setError(null)

    // Check if test exists and is active using the Backend Action
    const result = await verifyTestCode(cleanCode)

    if (!result.success) {
      setError(`Verification Error: ${result.error}`)
      setLoading(false)
      return
    }

    // Code is valid - bypass Next.js soft navigation router cache to prevent infinite load hangs
    window.location.href = `/student/test?code=${cleanCode}`
  }

  return (
    <div className="relative overflow-hidden rounded-2xl bg-white border border-slate-200 p-10 shadow-sm hover:shadow-md transition-shadow">
      <div className="relative z-10 max-w-2xl">
        <h2 className="text-2xl font-extrabold text-[#003B71] tracking-tight mb-2">Quiz Access Code</h2>
        <p className="text-slate-500 font-medium mb-8">
          Enter your 6-character access code to begin your personalized assessment.
        </p>
        
        <form onSubmit={handleStartTest} className="max-w-md">
          <div className="space-y-4">
            <label className="block text-xs font-extrabold text-[#003B71] uppercase tracking-widest mb-3 ml-1">Enter Quiz Code</label>
            <div className="flex gap-3">
              <input
                type="text"
                placeholder="e.g. 1A2B3D"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="flex-1 bg-white border border-slate-200 rounded-xl px-5 py-4 text-slate-900 font-bold tracking-widest focus:ring-4 focus:ring-[#003B71]/10 focus:border-[#003B71] outline-none transition-all uppercase placeholder:italic placeholder:font-normal placeholder:tracking-normal"
                maxLength={6}
              />
              <button
                type="submit"
                disabled={loading || code.length !== 6}
                className="bg-[#003B71] text-white px-8 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-[#00264d] disabled:opacity-30 transition-all shadow-lg active:scale-95 whitespace-nowrap"
              >
                {loading ? 'Verifying...' : 'Begin Quiz'}
              </button>
            </div>
            {error && (
              <div className="flex items-center gap-2 text-red-600 bg-red-50 px-4 py-2 rounded-lg border border-red-100 animate-in fade-in slide-in-from-top-1">
                <span className="text-xs font-bold leading-none">{error}</span>
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
