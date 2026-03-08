'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { joinCohortSecurely } from '@/app/setup-profile/actions'

interface Props {
  profile: any
  email: string
}

export default function SetupProfileClient({ profile, email }: Props) {
  const [firstName, setFirstName] = useState(profile?.first_name || '')
  const [lastName, setLastName] = useState(profile?.last_name || '')
  const [company, setCompany] = useState(profile?.company || '')
  const [companyEmail, setCompanyEmail] = useState(profile?.company_email || '')
  const [inviteCode, setInviteCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { error: upsertError } = await supabase
        .from('profiles')
        .update({
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          company: company.trim(),
          company_email: companyEmail.trim(),
        })
        .eq('id', profile.id)

      if (upsertError) {
        setLoading(false)
        setError(upsertError.message || 'Failed to securely save your profile. Please try again.')
        return
      }

      // Automatically join the passed cohort ID or validate/join the manual invite string securely on the backend
      const result = await joinCohortSecurely(profile.id, profile?.cohort_id, inviteCode.trim())
      
      if (!result?.success) {
        setLoading(false)
        setError(result?.error || 'Failed to join cohort. Please check your invite code.')
        return
      }

      setLoading(false)
      router.push('/student')
      router.refresh()
    } catch (err: any) {
      setLoading(false)
      setError(err.message || 'An unexpected error occurred during profile setup. Please try again.')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-sm text-red-400">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-6">
        <div>
          <label className="block text-xs font-extrabold text-[#003B71] uppercase tracking-widest mb-2 ml-1">First Name</label>
          <input
            type="text"
            required
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:border-[#003B71] focus:ring-1 focus:ring-[#003B71] transition-all font-medium"
            placeholder="Jane"
          />
        </div>
        <div>
          <label className="block text-xs font-extrabold text-[#003B71] uppercase tracking-widest mb-2 ml-1">Last Name</label>
          <input
            type="text"
            required
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:border-[#003B71] focus:ring-1 focus:ring-[#003B71] transition-all font-medium"
            placeholder="Smith"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-extrabold text-[#003B71] uppercase tracking-widest mb-2 ml-1">Company / Organization</label>
        <input
          type="text"
          required
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:border-[#003B71] focus:ring-1 focus:ring-[#003B71] transition-all font-medium"
          placeholder="Acme Corp"
        />
      </div>

      <div>
        <label className="block text-xs font-extrabold text-[#003B71] uppercase tracking-widest mb-2 ml-1">Company Email</label>
        <input
          type="email"
          required
          value={companyEmail}
          onChange={(e) => setCompanyEmail(e.target.value)}
          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:border-[#003B71] focus:ring-1 focus:ring-[#003B71] transition-all font-medium"
          placeholder="jane@acmecorp.com"
        />
        <p className="text-[10px] text-slate-400 mt-2 font-medium">This can differ from your login email so your instructor can identify you.</p>
      </div>

      <div className="pt-6 border-t border-slate-100">
        <label className="block text-xs font-extrabold text-emerald-600 uppercase tracking-widest mb-2 ml-1">Cohort Invite Code</label>
        <input
          type="text"
          value={inviteCode}
          onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
          className="w-full bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3 text-emerald-900 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all uppercase font-bold"
          placeholder="e.g. A1B2C3"
          maxLength={6}
        />
        <p className="text-[10px] text-slate-400 mt-2 font-medium">Enter a 6-character code to instantly join your training cohort.</p>
      </div>

      <div className="pt-4">
        <button
          type="submit"
          disabled={loading || !firstName.trim() || !lastName.trim() || !company.trim() || !companyEmail.trim()}
          className="w-full bg-[#003B71] hover:bg-[#00264d] disabled:opacity-50 disabled:cursor-not-allowed text-white px-8 py-4 rounded-xl text-sm font-black uppercase tracking-widest transition-all shadow-lg active:scale-95"
        >
          {loading ? 'Saving Profile...' : 'Update Account Profile'}
        </button>
      </div>
    </form>
  )
}
