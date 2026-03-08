'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { setCohortCookie } from './actions'

export default function AutoSelectCohort({ cohortId }: { cohortId: string }) {
  const router = useRouter()

  useEffect(() => {
    setCohortCookie(cohortId).then(() => {
      router.push('/student')
      router.refresh()
    })
  }, [cohortId, router])

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
      <div className="w-12 h-12 border-4 border-[#003B71] border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Entering Portal...</p>
    </div>
  )
}
