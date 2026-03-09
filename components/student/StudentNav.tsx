'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useRouter, usePathname } from 'next/navigation'
import Image from 'next/image'
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline'

interface Props {
  user: { email: string; name?: string | null; avatar?: string | null }
  showSwitchCohort?: boolean
}

export default function StudentNav({ user, showSwitchCohort }: Props) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const navLinks = [
    { name: 'Dashboard', href: '/student' },
    { name: 'Quizzes', href: '/student/tests' },
  ]

  const isActive = (href: string) => pathname === href

  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50 transition-all">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
        <Link href="/student" className="flex items-center gap-3 sm:gap-4 group shrink-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white border border-slate-200 overflow-hidden flex items-center justify-center shadow-sm group-hover:border-[#003B71]/30 transition-all">
            <Image src="/logo.png" alt="SG" width={40} height={40} className="object-cover" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm sm:text-base font-extrabold text-[#003B71] tracking-tight group-hover:text-slate-900 transition-colors">Steven Golus</span>
            <span className="text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none">Training Portal</span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <div className="flex-1 px-8 hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <Link 
              key={link.href} 
              href={link.href} 
              className={`text-sm font-bold transition-colors ${
                isActive(link.href) ? 'text-[#003B71]' : 'text-slate-500 hover:text-[#003B71]'
              }`}
            >
              {link.name}
            </Link>
          ))}
          <a 
            href="https://calendly.com/stevengolus/15" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-sm font-bold text-amber-600 hover:text-amber-700 transition-colors flex items-center gap-1"
          >
            Book Time
          </a>
          {showSwitchCohort && (
            <Link href="/student/select-cohort" className="text-sm font-bold text-slate-400 hover:text-[#003B71] transition-colors">
              Switch Cohort
            </Link>
          )}
        </div>

        <div className="flex items-center gap-3 sm:gap-6">
          <Link 
            href="/student/profile" 
            className="hidden sm:flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-[#003B71] transition-all"
          >
            {user.name ?? user.email}
          </Link>
          <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>
          <button
            onClick={handleSignOut}
            className="hidden sm:block text-xs font-extrabold text-slate-400 hover:text-red-600 transition-colors uppercase tracking-widest"
          >
            Sign out
          </button>

          {/* Mobile Menu Toggle */}
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 text-slate-500 hover:text-[#003B71] focus:outline-none"
          >
            {isMenuOpen ? (
              <XMarkIcon className="w-6 h-6 stroke-[2.5]" />
            ) : (
              <Bars3Icon className="w-6 h-6 stroke-[2.5]" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-b border-slate-200 animate-in slide-in-from-top duration-300">
          <nav className="flex flex-col p-4 space-y-1">
            {navLinks.map((link) => (
              <Link 
                key={link.href} 
                href={link.href}
                onClick={() => setIsMenuOpen(false)}
                className={`p-3 rounded-xl text-sm font-bold transition-all ${
                  isActive(link.href) 
                    ? 'bg-slate-50 text-[#003B71]' 
                    : 'text-slate-600 hover:bg-slate-50 hover:text-[#003B71]'
                }`}
              >
                {link.name}
              </Link>
            ))}
            <a 
              href="https://calendly.com/stevengolus/15" 
              target="_blank" 
              rel="noopener noreferrer"
              className="p-3 rounded-xl text-sm font-bold text-amber-600 hover:bg-amber-50 transition-all"
            >
              Book Time With Steven
            </a>
            {showSwitchCohort && (
              <Link 
                href="/student/select-cohort"
                onClick={() => setIsMenuOpen(false)}
                className="p-3 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-50 transition-all"
              >
                Switch Cohort
              </Link>
            )}
            <div className="h-px bg-slate-100 my-2"></div>
            <Link 
              href="/student/profile"
              onClick={() => setIsMenuOpen(false)}
              className="p-3 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all"
            >
              My Profile
            </Link>
            <button
              onClick={() => { handleSignOut(); setIsMenuOpen(false); }}
              className="p-3 rounded-xl text-sm font-black text-red-500 hover:bg-red-50 transition-all text-left uppercase tracking-widest"
            >
              Sign out
            </button>
          </nav>
        </div>
      )}
    </header>
  )
}
