'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import {
  DocumentTextIcon,
  QuestionMarkCircleIcon,
  ChartBarIcon,
  ClipboardDocumentCheckIcon,
  ArrowRightOnRectangleIcon,
  UserIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline'

const navItems = [
  { href: '/admin/tests', label: 'Quizzes', icon: ClipboardDocumentCheckIcon },
  { href: '/admin/cohorts', label: 'Cohorts', icon: UserGroupIcon },
  { href: '/admin/transcripts', label: 'Transcripts', icon: DocumentTextIcon },
  { href: '/admin/resources', label: 'Resource Library', icon: ClipboardDocumentCheckIcon },
  { href: '/admin/analytics', label: 'Analytics', icon: ChartBarIcon },
]

interface Props {
  user: { email: string; name?: string | null; avatar?: string | null }
}

export default function AdminSidebar({ user }: Props) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col">
      {/* Header */}
      <div className="p-8 border-b border-slate-100">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200 overflow-hidden flex items-center justify-center flex-shrink-0 shadow-sm">
            <Image src="/logo.png" alt="SG" width={64} height={64} className="object-cover" />
          </div>
          <div className="text-center">
            <p className="text-lg font-extrabold text-[#003B71] tracking-tight">Steven Golus</p>
            <p className="text-[10px] uppercase font-bold text-slate-500 tracking-[0.2em] mt-1">Training Portal</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-6 space-y-2">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                active
                  ? 'bg-slate-50 text-[#003B71] shadow-sm border border-slate-200/60'
                  : 'text-slate-500 hover:text-[#003B71] hover:bg-slate-50'
              }`}
            >
              <Icon className={`w-5 h-5 flex-shrink-0 ${active ? 'text-[#003B71]' : 'text-slate-400'}`} />
              {label}
            </Link>
          )
        })}

        <div className="pt-6 mt-6 border-t border-slate-100">
          <Link
            href="/student"
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-slate-500 hover:text-[#003B71] hover:bg-slate-50 transition-all"
          >
            <UserIcon className="w-5 h-5 flex-shrink-0 text-slate-400" />
            Student View
          </Link>
        </div>
      </nav>

      {/* User Footer */}
      <div className="p-6 border-t border-slate-100 bg-slate-50/50">
        <div className="flex items-center gap-3 mb-4">
          {user.avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.avatar} alt="avatar" className="w-10 h-10 rounded-full border border-slate-200" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-[#003B71] flex items-center justify-center text-white text-sm font-bold shadow-sm">
              {(user.name ?? user.email)[0].toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <p className="text-sm font-bold text-slate-900 truncate">{user.name ?? 'Admin'}</p>
            <p className="text-[10px] font-medium text-slate-500 truncate">{user.email}</p>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-red-600 transition-colors w-full px-2"
        >
          <ArrowRightOnRectangleIcon className="w-4 h-4" />
          Sign out
        </button>
      </div>
    </aside>
  )
}
