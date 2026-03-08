import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import SetupProfileClient from '@/components/profile/SetupProfileClient'

export const metadata = { title: 'Account Settings | SG Assessment' }

export default async function StudentProfilePage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-[#003B71] tracking-tight">Account Settings</h1>
        <p className="text-slate-500 mt-2 font-medium">Manage your student profile and contact details.</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 sm:p-10 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1.5 h-full bg-[#003B71]" />
        <h3 className="text-xl font-bold text-slate-900 mb-8">Personal Information</h3>
        <SetupProfileClient profile={profile ?? { id: user.id }} />
      </div>
    </div>
  )
}
