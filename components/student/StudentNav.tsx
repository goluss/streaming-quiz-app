'use client'

import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

interface Props {
  user: { email: string; name?: string | null; avatar?: string | null }
  showSwitchCohort?: boolean
}

export default function StudentNav({ user, showSwitchCohort }: Props) {
  const router = useRouter()
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-30 transition-all">
      <div className="max-w-5xl mx-auto px-6 h-20 flex items-center justify-between">
        <Link href="/student" className="flex items-center gap-4 group">
          <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 overflow-hidden flex items-center justify-center shadow-sm group-hover:border-[#003B71]/30 transition-all">
            <Image src="/logo.png" alt="SG" width={40} height={40} className="object-cover" />
          </div>
          <div className="flex flex-col">
            <span className="text-base font-extrabold text-[#003B71] tracking-tight group-hover:text-slate-900 transition-colors">Steven Golus</span>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none">Training Portal</span>
          </div>
        </Link>
        <div className="flex-1 px-8 hidden md:flex items-center gap-6">
          <Link href="/student" className="text-sm font-bold text-slate-500 hover:text-[#003B71] transition-colors">
            Dashboard
          </Link>
          <Link href="/student/tests" className="text-sm font-bold text-slate-500 hover:text-[#003B71] transition-colors">
            Quizzes
          </Link>
          <a 
            href="https://calendly.com/stevengolus/15" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-sm font-bold text-amber-600 hover:text-amber-700 transition-colors flex items-center gap-1"
          >
            Book Time With Steven
          </a>
          {showSwitchCohort && (
            <Link href="/student/select-cohort" className="text-sm font-bold text-slate-400 hover:text-[#003B71] transition-colors">
              Switch Cohort
            </Link>
          )}
        </div>
        <div className="flex items-center gap-6">
          <Link 
            href="/student/profile" 
            className="hidden sm:flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-[#003B71] transition-all"
          >
            {user.name ?? user.email}
          </Link>
          <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>
          <button
            onClick={handleSignOut}
            className="text-xs font-extrabold text-slate-400 hover:text-red-600 transition-colors uppercase tracking-widest"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  )
}
