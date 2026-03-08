import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import SetupProfileClient from '@/components/profile/SetupProfileClient'

export const metadata = { title: 'Complete Your Profile | SG Assessment' }

export default async function SetupProfilePage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // If already complete, skip redirect (middleware usually handles this, but secondary check)
  if (profile?.first_name && profile?.last_name && profile?.company && profile?.company_email) {
    redirect('/student')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="relative w-full max-w-lg">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black text-[#003B71] tracking-tight">Steven Golus Training</h1>
          <p className="text-slate-500 mt-2 font-medium">Almost there Please complete your profile to continue.</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl p-6 sm:p-8">
          <SetupProfileClient profile={profile ?? { id: user.id }} email={user.email!} />
        </div>
      </div>
    </div>
  )
}
